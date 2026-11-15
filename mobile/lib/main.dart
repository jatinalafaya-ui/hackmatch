import 'package:material_ui/material_ui.dart';

import 'api_client.dart';
import 'models.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'theme.dart';

void main() {
  runApp(HackMatchApp(api: ApiClient()));
}

class HackMatchApp extends StatefulWidget {
  final ApiClient api;

  const HackMatchApp({super.key, required this.api});

  @override
  State<HackMatchApp> createState() => _HackMatchAppState();
}

class _HackMatchAppState extends State<HackMatchApp> {
  CurrentUser? _user;
  bool _starting = true;

  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  // Reuse a saved login if the token is still valid; otherwise start at
  // the login screen.
  Future<void> _restoreSession() async {
    await widget.api.loadToken();
    if (widget.api.isLoggedIn) {
      try {
        _user = await widget.api.me();
      } on ApiException {
        await widget.api.logout();
      }
    }
    if (mounted) setState(() => _starting = false);
  }

  Future<void> _logout() async {
    await widget.api.logout();
    setState(() => _user = null);
  }

  @override
  Widget build(BuildContext context) {
    Widget home;
    if (_starting) {
      home = const Scaffold(body: Center(child: CircularProgressIndicator()));
    } else if (_user == null) {
      home = LoginScreen(api: widget.api, onLoggedIn: (user) => setState(() => _user = user));
    } else {
      home = HomeScreen(
        api: widget.api,
        user: _user!,
        onUserUpdated: (user) => setState(() => _user = user),
        onLogout: _logout,
      );
    }

    return MaterialApp(
      title: 'HackMatch',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      home: home,
    );
  }
}
