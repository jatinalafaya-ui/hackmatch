const mongoose = require('mongoose');

const ROLES = ['hacker', 'mentor'];

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    role: { type: String, enum: ROLES, default: 'hacker' },
    school: { type: String, trim: true, maxlength: 100, default: '' },
    skills: { type: [String], default: [] },
    lookingFor: { type: String, trim: true, maxlength: 200, default: '' },
    bio: { type: String, trim: true, maxlength: 500, default: '' },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ isVerified: 1, lastName: 1, firstName: 1 });

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    firstName: this.firstName,
    lastName: this.lastName,
    role: this.role,
    school: this.school,
    skills: this.skills,
    lookingFor: this.lookingFor,
    bio: this.bio,
  };
};

userSchema.methods.toSelf = function toSelf() {
  return { ...this.toPublic(), email: this.email, isVerified: this.isVerified };
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
