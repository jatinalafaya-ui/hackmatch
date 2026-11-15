const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const { connectDb, disconnectDb } = require('./db');

const SEED_DOMAIN = 'seed.hackmatch.test';

const people = [
  ['Andrea', 'Lopez', 'hacker', 'UCF', ['React', 'TypeScript', 'Figma'], 'A backend dev for a fintech idea'],
  ['Marcus', 'Reed', 'hacker', 'UCF', ['Python', 'PyTorch', 'FastAPI'], 'Frontend teammates for an ML demo'],
  ['Priya', 'Natarajan', 'hacker', 'USF', ['Flutter', 'Dart', 'Firebase'], 'Anyone who wants to ship a mobile app'],
  ['Kevin', 'Tran', 'hacker', 'UCF', ['Node.js', 'Express', 'MongoDB'], 'A designer and a frontend dev'],
  ['Sofia', 'Martinez', 'mentor', 'Lockheed Martin', ['Systems design', 'Java', 'AWS'], 'Teams that need architecture help'],
  ['Daniel', 'Kim', 'hacker', 'UF', ['C++', 'Embedded', 'Arduino'], 'A hardware hack team'],
  ['Aisha', 'Bello', 'hacker', 'UCF', ['UI design', 'Figma', 'Accessibility'], 'Developers who care about UX'],
  ['Ethan', 'Walsh', 'hacker', 'FIU', ['Go', 'Docker', 'Kubernetes'], 'A team building developer tools'],
  ['Mei', 'Chen', 'mentor', 'EA Orlando', ['Unity', 'C#', 'Game design'], 'Game teams that want feedback'],
  ['Jordan', 'Patel', 'hacker', 'UCF', ['React Native', 'Expo', 'TypeScript'], 'A health or wellness project'],
  ['Lucas', 'Oliveira', 'hacker', 'Valencia College', ['HTML', 'CSS', 'JavaScript'], 'My first hackathon team'],
  ['Hannah', 'Schmidt', 'hacker', 'UCF', ['Data science', 'pandas', 'SQL'], 'A data visualization project'],
  ['Omar', 'Haddad', 'hacker', 'UCF', ['Cybersecurity', 'Rust', 'Linux'], 'A security-focused hack'],
  ['Grace', 'Okafor', 'mentor', 'Microsoft', ['Azure', 'C#', '.NET'], 'Teams deploying to the cloud'],
  ['Tyler', 'Brooks', 'hacker', 'UCF', ['Swift', 'iOS', 'SwiftUI'], 'An iOS app team'],
  ['Isabella', 'Rossi', 'hacker', 'Rollins College', ['Product management', 'Pitching'], 'Builders who need a pitch lead'],
  ['Noah', 'Fischer', 'hacker', 'UCF', ['Java', 'Spring Boot', 'PostgreSQL'], 'A backend-heavy project'],
  ['Zara', 'Ahmed', 'hacker', 'USF', ['Next.js', 'Tailwind', 'Vercel'], 'A fast-moving web team'],
  ['Carlos', 'Mendez', 'mentor', 'Siemens Energy', ['IoT', 'Python', 'MQTT'], 'Hardware and IoT teams'],
  ['Emily', 'Nguyen', 'hacker', 'UCF', ['Machine learning', 'TensorFlow', 'Python'], 'An AI for social good idea'],
  ['Ryan', "O'Connor", 'hacker', 'UCF', ['Blender', '3D modeling', 'Three.js'], 'A creative or AR project'],
  ['Fatima', 'Rahman', 'hacker', 'UCF', ['Kotlin', 'Android', 'Jetpack Compose'], 'An Android app team'],
  ['Benjamin', 'Cohen', 'hacker', 'UF', ['Solidity', 'Web3', 'TypeScript'], 'A blockchain hack'],
  ['Chloe', 'Dubois', 'mentor', 'Disney Imagineering', ['UX research', 'Prototyping'], 'Teams testing with users'],
  ['Samuel', 'Adeyemi', 'hacker', 'UCF', ['Flutter', 'Node.js', 'MongoDB'], 'A full-stack mobile project'],
  ['Olivia', 'Park', 'hacker', 'UCF', ['Vue', 'JavaScript', 'Firebase'], 'Frontend work on any idea'],
  ['Mateo', 'Garcia', 'hacker', 'FIU', ['OpenAI API', 'LangChain', 'Python'], 'An LLM agent project'],
  ['Ava', 'Thompson', 'hacker', 'UCF', ['Graphic design', 'Illustrator', 'Branding'], 'A team that needs visuals'],
  ['Liam', 'Murphy', 'mentor', 'Lockheed Martin', ['C++', 'Real-time systems'], 'Teams with performance problems'],
  ['Nadia', 'Petrova', 'hacker', 'UCF', ['Computer vision', 'OpenCV', 'Python'], 'A camera-based hack'],
  ['Jacob', 'Wright', 'hacker', 'Seminole State', ['PHP', 'MySQL', 'Laravel'], 'A web app team'],
  ['Leah', 'Goldberg', 'hacker', 'UCF', ['Accessibility', 'React', 'ARIA'], 'An accessibility tool'],
  ['Diego', 'Ramirez', 'hacker', 'UCF', ['Express', 'TypeScript', 'Redis'], 'Backend for a real-time app'],
  ['Maya', 'Singh', 'mentor', 'Google', ['Android', 'Kotlin', 'Firebase'], 'Mobile teams'],
  ['Elijah', 'Johnson', 'hacker', 'UCF', ['Bash', 'DevOps', 'GitHub Actions'], 'A team that needs CI/CD'],
  ['Camila', 'Torres', 'hacker', 'USF', ['Figma', 'React', 'Storybook'], 'A design-system project'],
  ['Henry', 'Liu', 'hacker', 'UCF', ['Algorithms', 'C++', 'Competitive programming'], 'A hard technical problem'],
  ['Amara', 'Diallo', 'hacker', 'UCF', ['Public speaking', 'Pitching', 'Business'], 'Builders who need a presenter'],
  ['Owen', 'Price', 'hacker', 'UCF', ['Unreal Engine', 'C++', 'Game dev'], 'A game jam team'],
  ['Layla', 'Hassan', 'hacker', 'UCF', ['Healthcare', 'Data analysis', 'R'], 'A healthcare data project'],
  ['Gabriel', 'Silva', 'mentor', 'Electronic Arts', ['Backend', 'Go', 'Microservices'], 'Teams scaling an API'],
  ['Ruby', 'Evans', 'hacker', 'UCF', ['Svelte', 'TypeScript', 'Supabase'], 'Any web project'],
  ['Isaac', 'Bennett', 'hacker', 'UF', ['Raspberry Pi', 'Python', 'Sensors'], 'A sustainability hardware hack'],
  ['Yuki', 'Tanaka', 'hacker', 'UCF', ['Animation', 'After Effects', 'UI motion'], 'A team that wants polish'],
  ['Alexander', 'Novak', 'hacker', 'UCF', ['MongoDB', 'Mongoose', 'Node.js'], 'A MERN team'],
  ['Sara', 'Lindqvist', 'mentor', 'Amazon', ['AWS', 'Lambda', 'DynamoDB'], 'Serverless questions'],
  ['Victor', 'Alvarez', 'hacker', 'UCF', ['Robotics', 'ROS', 'C++'], 'A robotics hack'],
  ['Naomi', 'Clarke', 'hacker', 'UCF', ['Technical writing', 'Docs', 'Markdown'], 'A team that needs a README hero'],
];

async function seed() {
  await connectDb();
  // Seeded people get a random password nobody knows, so they can't log in.
  const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12);

  await User.deleteMany({ email: { $regex: `@${SEED_DOMAIN.replace(/\./g, '\\.')}$` } });
  await User.insertMany(
    people.map(([firstName, lastName, role, school, skills, lookingFor]) => ({
      email: `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, '') + `@${SEED_DOMAIN}`,
      passwordHash,
      firstName,
      lastName,
      role,
      school,
      skills,
      lookingFor,
      bio: `${role === 'mentor' ? 'Mentoring' : 'Hacking'} at Knight Hacks. Ask me about ${skills[0]}.`,
      isVerified: true,
    }))
  );
  console.log(`Seeded ${people.length} attendees`);
}

if (require.main === module) {
  seed()
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => disconnectDb());
}

module.exports = { seed, people };
