import 'package:material_ui/material_ui.dart';

import '../api_client.dart';
import '../models.dart';
import '../widgets/attendee_card.dart';

class ShortlistScreen extends StatefulWidget {
  final ApiClient api;

  const ShortlistScreen({super.key, required this.api});

  @override
  State<ShortlistScreen> createState() => _ShortlistScreenState();
}

class _ShortlistScreenState extends State<ShortlistScreen> {
  List<ShortlistEntry> _entries = [];
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final entries = await widget.api.shortlist();
      if (!mounted) return;
      setState(() {
        _entries = entries;
        _error = '';
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _edit(ShortlistEntry entry) async {
    final note = TextEditingController(text: entry.note);
    var status = entry.status;
    final save = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(entry.member.fullName),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                initialValue: status,
                decoration: const InputDecoration(labelText: 'Status'),
                items: [
                  for (final s in shortlistStatuses.entries) DropdownMenuItem(value: s.key, child: Text(s.value)),
                ],
                onChanged: (value) => setDialogState(() => status = value ?? status),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: note,
                maxLength: 300,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'My note'),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
            FilledButton(
              style: FilledButton.styleFrom(minimumSize: const Size(88, 40)),
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
    final text = note.text;
    note.dispose();
    if (save != true) return;

    try {
      final updated = await widget.api.updateShortlistEntry(entry.id, note: text, status: status);
      setState(() => _entries = [for (final e in _entries) e.id == updated.id ? updated : e]);
    } on ApiException catch (e) {
      _showMessage(e.message);
    }
  }

  Future<void> _remove(ShortlistEntry entry) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove from shortlist?'),
        content: Text('${entry.member.fullName} will be removed from your shortlist.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Remove')),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await widget.api.removeFromShortlist(entry.id);
      setState(() => _entries.removeWhere((e) => e.id == entry.id));
    } on ApiException catch (e) {
      _showMessage(e.message);
    }
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error.isNotEmpty) return Center(child: Text(_error));
    if (_entries.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('Your shortlist is empty. Add people from the Search tab.', textAlign: TextAlign.center),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.symmetric(vertical: 10),
        children: [
          for (final entry in _entries)
            AttendeeCard(
              person: entry.member,
              footer: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Divider(),
                  Text('Status: ${shortlistStatuses[entry.status] ?? entry.status}',
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  if (entry.note.isNotEmpty) Text('Note: ${entry.note}'),
                  Row(
                    children: [
                      TextButton.icon(
                        onPressed: () => _edit(entry),
                        icon: const Icon(Icons.edit_outlined),
                        label: const Text('Edit'),
                      ),
                      TextButton.icon(
                        onPressed: () => _remove(entry),
                        icon: const Icon(Icons.delete_outline),
                        label: const Text('Remove'),
                        style: TextButton.styleFrom(foregroundColor: Colors.red.shade700),
                      ),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
