import 'package:material_ui/material_ui.dart';

import '../api_client.dart';
import 'auth_scaffold.dart';

class ForgotPasswordScreen extends StatefulWidget {
  final ApiClient api;

  const ForgotPasswordScreen({super.key, required this.api});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _email = TextEditingController();
  String _error = '';
  String _info = '';
  bool _busy = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() {
      _busy = true;
      _error = '';
      _info = '';
    });
    try {
      final message = await widget.api.forgotPassword(_email.text.trim());
      setState(() => _info = message);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Reset your password',
      subtitle: "Enter your email and we'll send you a reset link.",
      children: [
        MessageBox(message: _error),
        MessageBox(message: _info, isError: false),
        TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(labelText: 'Email'),
          onSubmitted: (_) => _send(),
        ),
        const SizedBox(height: 20),
        FilledButton(onPressed: _busy ? null : _send, child: Text(_busy ? 'Sending…' : 'Send reset link')),
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Back to log in')),
      ],
    );
  }
}
