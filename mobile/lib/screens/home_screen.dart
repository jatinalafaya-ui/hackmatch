import 'package:material_ui/material_ui.dart';

import '../api_client.dart';
import '../models.dart';
import 'profile_screen.dart';
import 'search_screen.dart';
import 'shortlist_screen.dart';

class HomeScreen extends StatefulWidget {
  final ApiClient api;
  final CurrentUser user;
  final ValueChanged<CurrentUser> onUserUpdated;
  final VoidCallback onLogout;

  const HomeScreen({
    super.key,
    required this.api,
    required this.user,
    required this.onUserUpdated,
    required this.onLogout,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tab = 0;
  static const _titles = ['Find teammates', 'My shortlist', 'My profile'];

  @override
  Widget build(BuildContext context) {
    final pages = [
      SearchScreen(api: widget.api),
      // A new key each visit reloads the shortlist after adding people in Search.
      ShortlistScreen(key: UniqueKey(), api: widget.api),
      ProfileScreen(api: widget.api, user: widget.user, onUpdated: widget.onUserUpdated),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_tab]),
        actions: [
          IconButton(tooltip: 'Log out', icon: const Icon(Icons.logout), onPressed: widget.onLogout),
        ],
      ),
      body: IndexedStack(index: _tab, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (index) => setState(() => _tab = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.search), label: 'Search'),
          NavigationDestination(icon: Icon(Icons.bookmark_outline), label: 'Shortlist'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}
