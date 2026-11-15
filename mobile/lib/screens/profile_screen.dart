import 'package:material_ui/material_ui.dart';

import '../api_client.dart';
import '../models.dart';

class ProfileScreen extends StatefulWidget {
  final ApiClient api;
  final CurrentUser user;
  final ValueChanged<CurrentUser> onUpdated;

  const ProfileScreen({super.key, required this.api, required this.user, required this.onUpdated});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late final _firstName = TextEditingController(text: widget.user.firstName);
  late final _lastName = TextEditingController(text: widget.user.lastName);
  late final _school = TextEditingController(text: widget.user.school);
  late final _skills = TextEditingController(text: widget.user.skills.join(', '));
  late final _lookingFor = TextEditingController(text: widget.user.lookingFor);
  late final _bio = TextEditingController(text: widget.user.bio);
  late String _role = widget.user.role;
  bool _busy = false;

  @override
  void dispose() {
    for (final c in [_firstName, _lastName, _school, _skills, _lookingFor, _bio]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _busy = true);
    try {
      final user = await widget.api.updateMe({
        'firstName': _firstName.text,
        'lastName': _lastName.text,
        'role': _role,
        'school': _school.text,
        'skills': _skills.text.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList(),
        'lookingFor': _lookingFor.text,
        'bio': _bio.text,
      });
      widget.onUpdated(user);
      _show('Profile saved');
    } on ApiException catch (e) {
      _show(e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _show(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Signed in as ${widget.user.email}', style: TextStyle(color: Colors.grey.shade700)),
        const SizedBox(height: 16),
        TextField(controller: _firstName, decoration: const InputDecoration(labelText: 'First name')),
        const SizedBox(height: 12),
        TextField(controller: _lastName, decoration: const InputDecoration(labelText: 'Last name')),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: _role,
          decoration: const InputDecoration(labelText: "I'm joining as a"),
          items: const [
            DropdownMenuItem(value: 'hacker', child: Text('Hacker')),
            DropdownMenuItem(value: 'mentor', child: Text('Mentor')),
          ],
          onChanged: (value) => setState(() => _role = value ?? _role),
        ),
        const SizedBox(height: 12),
        TextField(controller: _school, decoration: const InputDecoration(labelText: 'School or company')),
        const SizedBox(height: 12),
        TextField(
          controller: _skills,
          decoration: const InputDecoration(labelText: 'Skills', helperText: 'Separate with commas'),
        ),
        const SizedBox(height: 12),
        TextField(controller: _lookingFor, maxLength: 200, decoration: const InputDecoration(labelText: 'Looking for')),
        TextField(controller: _bio, maxLength: 500, maxLines: 3, decoration: const InputDecoration(labelText: 'Short bio')),
        const SizedBox(height: 12),
        FilledButton(onPressed: _busy ? null : _save, child: Text(_busy ? 'Saving…' : 'Save profile')),
      ],
    );
  }
}
