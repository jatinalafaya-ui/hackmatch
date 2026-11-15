import 'package:material_ui/material_ui.dart';

import '../api_client.dart';
import '../models.dart';
import 'auth_scaffold.dart';
import 'forgot_password_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  final ApiClient api;
  final ValueChanged<CurrentUser> onLoggedIn;

  const LoginScreen({super.key, required this.api, required this.onLoggedIn});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  String _error = '';
  String _info = '';
  bool _needsVerify = false;
  bool _busy = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() {
      _busy = true;
      _error = '';
      _info = '';
      _needsVerify = false;
    });
    try {
      final user = await widget.api.login(_email.text.trim(), _password.text);
      widget.onLoggedIn(user);
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _needsVerify = e.status == 403;
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _resend() async {
    try {
      final message = await widget.api.resendVerification(_email.text.trim());
      setState(() {
        _error = '';
        _needsVerify = false;
        _info = message;
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Log in',
      subtitle: 'Find teammates and mentors for your next hackathon.',
      children: [
        MessageBox(message: _error),
        MessageBox(message: _info, isError: false),
        if (_needsVerify)
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(onPressed: _resend, child: const Text('Send me a new verification link')),
          ),
        TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          autofillHints: const [AutofillHints.email],
          decoration: const InputDecoration(labelText: 'Email'),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _password,
          obscureText: true,
          autofillHints: const [AutofillHints.password],
          decoration: const InputDecoration(labelText: 'Password'),
          onSubmitted: (_) => _login(),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => ForgotPasswordScreen(api: widget.api)),
            ),
            child: const Text('Forgot password?'),
          ),
        ),
        const SizedBox(height: 8),
        FilledButton(onPressed: _busy ? null : _login, child: Text(_busy ? 'Logging in…' : 'Log in')),
        const SizedBox(height: 12),
        TextButton(
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => RegisterScreen(api: widget.api)),
          ),
          child: const Text('New here? Create an account'),
        ),
      ],
    );
  }
}
