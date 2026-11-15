import 'package:material_ui/material_ui.dart';

import '../api_client.dart';
import 'auth_scaffold.dart';

class RegisterScreen extends StatefulWidget {
  final ApiClient api;

  const RegisterScreen({super.key, required this.api});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  String _error = '';
  String _sentTo = '';
  bool _busy = false;

  @override
  void dispose() {
    for (final c in [_firstName, _lastName, _email, _password, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _register() async {
    if (_password.text != _confirm.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }
    setState(() {
      _busy = true;
      _error = '';
    });
    try {
      await widget.api.register(
        email: _email.text.trim(),
        password: _password.text,
        firstName: _firstName.text.trim(),
        lastName: _lastName.text.trim(),
      );
      setState(() => _sentTo = _email.text.trim());
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_sentTo.isNotEmpty) {
      return AuthScaffold(
        title: 'Check your email',
        children: [
          Text('We sent a verification link to $_sentTo. Open it to finish creating your account. '
              'The link expires in 24 hours.'),
          const SizedBox(height: 20),
          FilledButton(onPressed: () => Navigator.pop(context), child: const Text('Back to log in')),
        ],
      );
    }

    return AuthScaffold(
      title: 'Create your account',
      subtitle: "We'll email you a link to verify it.",
      children: [
        MessageBox(message: _error),
        TextField(controller: _firstName, decoration: const InputDecoration(labelText: 'First name')),
        const SizedBox(height: 12),
        TextField(controller: _lastName, decoration: const InputDecoration(labelText: 'Last name')),
        const SizedBox(height: 12),
        TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(labelText: 'Email'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _password,
          obscureText: true,
          decoration: const InputDecoration(
            labelText: 'Password',
            helperText: 'At least 8 characters, with a letter and a number.',
          ),
        ),
        const SizedBox(height: 12),
        TextField(controller: _confirm, obscureText: true, decoration: const InputDecoration(labelText: 'Confirm password')),
        const SizedBox(height: 20),
        FilledButton(
          onPressed: _busy ? null : _register,
          child: Text(_busy ? 'Creating account…' : 'Create account'),
        ),
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Already have an account? Log in')),
      ],
    );
  }
}
