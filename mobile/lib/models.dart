class Attendee {
  final String id;
  final String firstName;
  final String lastName;
  final String role;
  final String school;
  final List<String> skills;
  final String lookingFor;
  final String bio;

  const Attendee({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.role,
    required this.school,
    required this.skills,
    required this.lookingFor,
    required this.bio,
  });

  String get fullName => '$firstName $lastName';

  String get initials =>
      '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'.toUpperCase();

  bool get isMentor => role == 'mentor';

  factory Attendee.fromJson(Map<String, dynamic> json) {
    return Attendee(
      id: json['id'] as String,
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      role: json['role'] as String? ?? 'hacker',
      school: json['school'] as String? ?? '',
      skills: (json['skills'] as List<dynamic>? ?? []).cast<String>(),
      lookingFor: json['lookingFor'] as String? ?? '',
      bio: json['bio'] as String? ?? '',
    );
  }
}

class CurrentUser extends Attendee {
  final String email;

  const CurrentUser({
    required super.id,
    required super.firstName,
    required super.lastName,
    required super.role,
    required super.school,
    required super.skills,
    required super.lookingFor,
    required super.bio,
    required this.email,
  });

  factory CurrentUser.fromJson(Map<String, dynamic> json) {
    final base = Attendee.fromJson(json);
    return CurrentUser(
      id: base.id,
      firstName: base.firstName,
      lastName: base.lastName,
      role: base.role,
      school: base.school,
      skills: base.skills,
      lookingFor: base.lookingFor,
      bio: base.bio,
      email: json['email'] as String? ?? '',
    );
  }
}

class ShortlistEntry {
  final String id;
  final String note;
  final String status;
  final Attendee member;

  const ShortlistEntry({required this.id, required this.note, required this.status, required this.member});

  factory ShortlistEntry.fromJson(Map<String, dynamic> json) {
    return ShortlistEntry(
      id: json['id'] as String,
      note: json['note'] as String? ?? '',
      status: json['status'] as String? ?? 'interested',
      member: Attendee.fromJson(json['member'] as Map<String, dynamic>),
    );
  }
}

class SearchPage {
  final List<Attendee> results;
  final int total;

  const SearchPage({required this.results, required this.total});
}

const shortlistStatuses = {
  'interested': 'Interested',
  'contacted': 'Contacted',
  'teamed': 'On my team',
};
