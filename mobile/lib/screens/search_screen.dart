import 'dart:async';

import 'package:material_ui/material_ui.dart';

import '../api_client.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets/attendee_card.dart';

class SearchScreen extends StatefulWidget {
  final ApiClient api;

  const SearchScreen({super.key, required this.api});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _query = TextEditingController();
  Timer? _debounce;
  String _role = '';
  List<Attendee> _results = [];
  int _total = 0;
  bool _loading = true;
  String _error = '';
  final Map<String, String> _added = {};
  int _requestId = 0;

  @override
  void initState() {
    super.initState();
    _search();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _query.dispose();
    super.dispose();
  }

  void _onQueryChanged(String _) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), _search);
  }

  // Ignore answers to older requests so slow responses can't overwrite
  // newer results while the user is still typing.
  Future<void> _search() async {
    final id = ++_requestId;
    setState(() => _loading = true);
    try {
      final page = await widget.api.search(_query.text.trim(), role: _role);
      if (id != _requestId || !mounted) return;
      setState(() {
        _results = page.results;
        _total = page.total;
        _error = '';
      });
    } on ApiException catch (e) {
      if (id == _requestId && mounted) setState(() => _error = e.message);
    } finally {
      if (id == _requestId && mounted) setState(() => _loading = false);
    }
  }

  Future<void> _add(Attendee person) async {
    try {
      await widget.api.addToShortlist(person.id);
      setState(() => _added[person.id] = 'Added to your shortlist');
    } on ApiException catch (e) {
      setState(() => _added[person.id] = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: TextField(
            controller: _query,
            onChanged: _onQueryChanged,
            textInputAction: TextInputAction.search,
            decoration: const InputDecoration(
              labelText: 'Search name, school, skill…',
              prefixIcon: Icon(Icons.search),
            ),
          ),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              for (final entry in const {'': 'Everyone', 'hacker': 'Hackers', 'mentor': 'Mentors'}.entries)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(entry.value),
                    selected: _role == entry.key,
                    onSelected: (_) {
                      setState(() => _role = entry.key);
                      _search();
                    },
                  ),
                ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              _loading ? 'Searching…' : '$_total ${_total == 1 ? 'person' : 'people'} found',
              style: TextStyle(color: Colors.grey.shade700),
            ),
          ),
        ),
        if (_error.isNotEmpty)
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(_error, style: const TextStyle(color: Colors.red)),
          ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _search,
            child: ListView.builder(
              padding: const EdgeInsets.only(bottom: 16),
              itemCount: _results.length,
              itemBuilder: (context, index) {
                final person = _results[index];
                final added = _added[person.id];
                return AttendeeCard(
                  person: person,
                  footer: added != null
                      ? Text(added, style: const TextStyle(color: Color(0xFF0F5132)))
                      : OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: brand,
                            side: const BorderSide(color: brand),
                          ),
                          onPressed: () => _add(person),
                          child: const Text('Add to shortlist'),
                        ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}
