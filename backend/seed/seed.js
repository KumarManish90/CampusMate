/**
 * CampusMate demo data seeder.
 *
 *   npm run seed
 *
 * Idempotent: matches existing documents by a stable key (email for users,
 * {author, caption} for posts, etc.) and upserts, so running this twice does
 * NOT create duplicate demo content.
 *
 * Media: this script expects the local placeholder media already committed
 * under backend/uploads/{profiles,posts,reels,thumbnails,clubs,events} (all
 * generated offline — gradient avatars/cards + short captioned clips — never
 * scraped or real student photos). If MEDIA_STORAGE_MODE=cloudinary, point
 * MEDIA_BASE_URL at wherever you've re-uploaded those same files, or swap in
 * your own licensed demo media before running this in a shared environment.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const College = require("../models/College");
const Post = require("../models/Post");
const Reel = require("../models/Reel");
const Story = require("../models/Story");
const Comment = require("../models/Comment");
const { Follow, Connection, Match, Message } = require("../models/Social");
const { Club, Event, Notification } = require("../models/Campus");

const MEDIA_BASE_URL = process.env.MEDIA_BASE_URL || ""; // e.g. http://localhost:5000 when serving locally

// Colleges are real documents now, not a hardcoded enum. GGITS/GGCT/GGCE are
// seeded as "partner_verified" launch colleges with a real domain hint (used
// only to auto-classify emailType, never to require a college email). A
// fourth, unrelated college is seeded as "community_added" — exactly the
// kind of entry a student would create themselves via "Can't find your
// college? Add your college" — to prove the platform isn't GGITS-only.
const collegeDefs = [
  { code: "GGITS", name: "GGITS", fullName: "Gyan Ganga Institute of Technology & Science", city: "Jabalpur", state: "Madhya Pradesh", domain: "ggits.org", verificationStatus: "partner_verified" },
  { code: "GGCT", name: "GGCT", fullName: "Gyan Ganga College of Technology", city: "Jabalpur", state: "Madhya Pradesh", domain: "ggct.org", verificationStatus: "partner_verified" },
  { code: "GGCE", name: "GGCE", fullName: "Gyan Ganga College of Engineering", city: "Jabalpur", state: "Madhya Pradesh", domain: "ggce.org", verificationStatus: "partner_verified" },
  { code: "OTHER", name: "St. Aloysius College", city: "Jabalpur", state: "Madhya Pradesh", verificationStatus: "community_added" },
];

const students = [
  { name: "Rahul Sharma", college: "GGITS", branch: "CSE", year: "3rd Year", bio: "Building AI projects and losing sleep over hackathons.", interests: ["AI/ML", "Coding", "Cricket"], img: "user-01.jpg" },
  { name: "Priya Verma", college: "GGCT", branch: "CSE-DS", year: "2nd Year", bio: "Data nerd, chai enthusiast, occasional poet.", interests: ["AI/ML", "Writing", "Music"], img: "user-02.jpg" },
  { name: "Aditya Singh", college: "GGCE", branch: "Mechanical", year: "4th Year", bio: "CAD by day, football by evening.", interests: ["Robotics", "Football"], img: "user-03.jpg" },
  { name: "Ishita Rao", college: "GGCT", branch: "ECE", year: "2nd Year", bio: "Circuits, synths, and stage lights.", interests: ["Music", "Design"], img: "user-04.jpg" },
  { name: "Karan Mehta", college: "GGITS", branch: "IT", year: "3rd Year", bio: "Full-stack by day, competitive gamer by night.", interests: ["Web Dev", "Gaming", "Open Source"], img: "user-05.jpg" },
  { name: "Ananya Joshi", college: "GGCE", branch: "Civil", year: "1st Year", bio: "New here, exploring every club before I pick one.", interests: ["Photography", "Dance"], img: "user-06.jpg" },
  { name: "Yash Patel", college: "GGITS", branch: "CSE-AIML", year: "4th Year", bio: "Training models, mostly training patience.", interests: ["AI/ML", "Startups"], img: "user-07.jpg" },
  { name: "Sneha Kulkarni", college: "GGCT", branch: "EE", year: "2nd Year", bio: "Powers systems by day, sketchbook by night.", interests: ["Design", "Photography"], img: "user-08.jpg" },
  { name: "Devansh Rathore", college: "GGCE", branch: "CSE", year: "3rd Year", bio: "Open-source contributor, chronic overcommitter.", interests: ["Open Source", "Coding", "Startups"], img: "user-09.jpg" },
  { name: "Meera Nair", college: "GGITS", branch: "IT", year: "1st Year", bio: "Front-end obsessive. Ask me about type scales.", interests: ["Web Dev", "Design"], img: "user-10.jpg" },
  { name: "Rohan Patel", college: "GGCE", branch: "Mechanical", year: "3rd Year", bio: "Robotics club lead. Building bots that (mostly) obey.", interests: ["Robotics", "Coding"], img: "user-11.jpg" },
  { name: "Aarav Sharma", college: "GGITS", branch: "CSE", year: "2nd Year", bio: "DSA grinder, chai over coffee.", interests: ["Coding", "Cricket"], img: "user-12.jpg" },
  { name: "Kavya Iyer", college: "GGCT", branch: "CSE", year: "3rd Year", bio: "Cultural club core team. Always humming something.", interests: ["Music", "Dance"], img: "user-13.jpg" },
  { name: "Vikram Chauhan", college: "GGCE", branch: "Civil", year: "4th Year", bio: "Site visits, sketches, and way too much chai.", interests: ["Photography", "Design"], img: "user-14.jpg" },
  { name: "Neha Kapoor", college: "GGCT", branch: "IT", year: "2nd Year", bio: "UI tinkerer. Figma open in one tab, VS Code in the other.", interests: ["Design", "Web Dev"], img: "user-15.jpg" },
  { name: "Farhan Ali", college: "OTHER", branch: "BCA", year: "2nd Year", bio: "Proof CampusMate isn't a one-college app. Say hi from St. Aloysius 👋", interests: ["Coding", "Music"], img: "user-01.jpg" },
];

const postSeeds = [
  { by: 0, img: "post-01.jpg", caption: "Late-night debugging finally paid off 😂💻", hashtags: ["#GGITS", "#Hackathon", "#Coding"], age: 5 },
  { by: 1, img: "post-02.jpg", caption: "Weekend sketch dump from the CSE-DS studio ✏️", hashtags: ["#GGCT", "#CampusLife"], age: 23 },
  { by: 8, img: "post-03.jpg", caption: "Open-source study group meets Thursday, all colleges welcome 🙌", hashtags: ["#Coding", "#GGCE"], age: 60 },
  { by: 2, img: "post-04.jpg", caption: "RoboWar bot v3 just cleared its first obstacle run 🤖", hashtags: ["#GGCE", "#RoboWar"], age: 180 },
  { by: 3, img: "post-05.jpg", caption: "Soundcheck before the Sanskriti fest rehearsal 🎶", hashtags: ["#GGCT", "#CollegeFest"], age: 240 },
  { by: 6, img: "post-06.jpg", caption: "Two seats left in the AI/ML bootcamp waitlist — DM to grab one 🧠", hashtags: ["#GGITS", "#Coding"], age: 300 },
  { by: 10, img: "post-07.jpg", caption: "Campus sunsets never disappoint 🌅", hashtags: ["#GGCE", "#CampusLife"], age: 400 },
  { by: 0, img: "post-08.jpg", caption: "3 hours of coding and one cup of chai later ☕", hashtags: ["#GGITS", "#StudentLife"], age: 500 },
  { by: 12, img: "post-09.jpg", caption: "Cultural fest rehearsal chaos, in the best way 🎭", hashtags: ["#GGCT", "#CollegeFest"], age: 620 },
  { by: 14, img: "post-10.jpg", caption: "Library grind before the mid-sems 📚", hashtags: ["#GGCT", "#StudentLife"], age: 700 },
  { by: 9, img: "post-11.jpg", caption: "Placement prep workshop — solid turnout today 🎯", hashtags: ["#GGCE", "#CampusLife"], age: 900 },
  { by: 4, img: "post-12.jpg", caption: "Cricket league finals this weekend, GGITS vs everyone 🏏", hashtags: ["#GGITS", "#StudentLife"], age: 1080 },
];

const reelSeeds = [
  { by: 0, video: "reel-01.mp4", thumb: "reel-01.jpg", caption: "Campus vibes before the hackathon 🔥", audio: "Original Audio — Rahul Sharma", hashtags: ["#GGITS", "#Hackathon"], duration: 6 },
  { by: 3, video: "reel-02.mp4", thumb: "reel-02.jpg", caption: "60 seconds inside the Sanskriti fest rehearsal 🎶", audio: "Original Audio — Ishita Rao", hashtags: ["#GGCT", "#CollegeFest"], duration: 8 },
  { by: 2, video: "reel-03.mp4", thumb: "reel-03.jpg", caption: "RoboWar bot survives round 1 🤖", audio: "trending campus beat", hashtags: ["#GGCE", "#RoboWar"], duration: 10 },
  { by: 8, video: "reel-04.mp4", thumb: "reel-04.jpg", caption: "POV: your PR finally gets merged", audio: "Original Audio — Devansh Rathore", hashtags: ["#Coding", "#GGCE"], duration: 12 },
  { by: 4, video: "reel-05.mp4", thumb: "reel-05.jpg", caption: "Late night debugging with the squad", audio: "lofi campus mix", hashtags: ["#GGITS", "#CampusLife"], duration: 15 },
  { by: 7, video: "reel-06.mp4", thumb: "reel-06.jpg", caption: "Coffee break with the AI/ML club ☕", audio: "Original Audio — Sneha Kulkarni", hashtags: ["#GGCT", "#TechClub"], duration: 20 },
];

const clubSeeds = [
  { name: "Coding Club", college: "GGITS", img: "club-01.jpg", desc: "Weekly DSA sprints and open-source Fridays." },
  { name: "Robotics Club", college: "GGCE", img: "club-02.jpg", desc: "Autonomous bots and the annual RoboWar." },
  { name: "AI/ML Club", college: "GGCT", img: "club-03.jpg", desc: "Paper reading circles and Kaggle nights." },
  { name: "Entrepreneurship Cell", college: "GGITS", img: "club-04.jpg", desc: "Pitch nights, founder AMAs, campus incubation." },
  { name: "Cultural Club", college: "GGCT", img: "club-05.jpg", desc: "Fests, fine arts, and the annual cultural night." },
  { name: "Photography Club", college: "GGCE", img: "club-06.jpg", desc: "Campus walks, gear talk, monthly exhibits." },
];

const eventSeeds = [
  { title: "Hackathon 2026", college: "GGITS", img: "event-01.jpg", venue: "GGITS Main Auditorium", daysFromNow: 6 },
  { title: "AI/ML Bootcamp", college: "GGCT", img: "event-02.jpg", venue: "GGCT Seminar Hall", daysFromNow: 11 },
  { title: "RoboWar Finals", college: "GGCE", img: "event-03.jpg", venue: "GGCE Sports Complex", daysFromNow: 16 },
  { title: "Startup Pitch Night", college: "GGITS", img: "event-04.jpg", venue: "GGITS Innovation Lab", daysFromNow: 22 },
  { title: "Cultural Fest — Sanskriti", college: "GGCT", img: "event-05.jpg", venue: "GGCT Open Grounds", daysFromNow: 27 },
  { title: "Placement Prep Workshop", college: "GGCE", img: "event-06.jpg", venue: "GGCE Seminar Hall", daysFromNow: 31 },
  { title: "Photography Walk", college: "GGCE", img: "event-07.jpg", venue: "Campus Grounds", daysFromNow: 9 },
  { title: "Freshers Community Meetup", college: "GGITS", img: "event-08.jpg", venue: "GGITS Amphitheatre", daysFromNow: 3 },
];

const commentSeeds = [
  "This looks amazing 🔥", "Let's gooo! Save me a spot on the team 🙌", "The sunset is crazy!",
  "Which camera did you use?", "Just my phone 😂", "Your linework keeps getting better",
  "The turning radius on that thing is insane", "In for this, count me!", "We need more of these on campus",
  "This is going to be epic", "Totally agree!", "Same energy every semester 😂",
];

function daysAgo(n) { return new Date(Date.now() - n * 60 * 60 * 1000); }
const mediaUrl = (folder, file) => `${MEDIA_BASE_URL}/uploads/${folder}/${file}`;

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("[seed] connected to", mongoose.connection.name);

  const passwordHash = await bcrypt.hash("CampusMateDemo123!", 12);

  // ---- Colleges (upsert by name+city; idempotent) ----
  const collegeByCode = {};
  for (const c of collegeDefs) {
    const doc = await College.findOneAndUpdate(
      { name: c.name, city: c.city },
      { $setOnInsert: { name: c.name, fullName: c.fullName, city: c.city, state: c.state, domain: c.domain, verificationStatus: c.verificationStatus } },
      { upsert: true, new: true, collation: { locale: "en", strength: 2 } }
    );
    collegeByCode[c.code] = doc;
  }
  console.log(`[seed] colleges ready: ${Object.keys(collegeByCode).join(", ")}`);

  // ---- Users (upsert by email; idempotent) ----
  const userDocs = [];
  for (const s of students) {
    const email = `demo.${s.name.toLowerCase().replace(/[^a-z]+/g, ".")}@campusmate.local`;
    const college = collegeByCode[s.college];
    const doc = await User.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          name: s.name, email, passwordHash, emailType: "personal",
          college: college._id, collegeName: college.name, branch: s.branch, year: s.year,
          bio: s.bio, interests: s.interests, lookingFor: "Networking",
          profilePhoto: { url: mediaUrl("profiles", s.img) },
          isDemoAccount: true, verificationStatus: "unverified",
        },
      },
      { upsert: true, new: true }
    );
    userDocs.push(doc);
    await College.updateOne({ _id: college._id }, { $inc: { studentCount: 0 } }); // count is only incremented on real registration, not re-seeds
  }
  // set studentCount once per college based on actual current seed membership (idempotent-safe)
  for (const code of Object.keys(collegeByCode)) {
    const count = await User.countDocuments({ college: collegeByCode[code]._id });
    await College.updateOne({ _id: collegeByCode[code]._id }, { studentCount: count });
  }

  // three demo login accounts, one per launch college (clearly fictional, dev-only)
  const demoLogins = [
    { email: "demo.ggits@campusmate.local", name: "Demo GGITS Student", code: "GGITS" },
    { email: "demo.ggct@campusmate.local", name: "Demo GGCT Student", code: "GGCT" },
    { email: "demo.ggce@campusmate.local", name: "Demo GGCE Student", code: "GGCE" },
  ];
  for (const d of demoLogins) {
    const college = collegeByCode[d.code];
    await User.findOneAndUpdate(
      { email: d.email },
      { $setOnInsert: { name: d.name, email: d.email, passwordHash, college: college._id, collegeName: college.name, isDemoAccount: true, bio: "Demo login account — not a real student.", interests: [] } },
      { upsert: true }
    );
  }
  console.log(`[seed] users ready: ${userDocs.length} profiles + ${demoLogins.length} demo logins`);

  // ---- Posts ----
  let postsCreated = 0;
  const postDocs = [];
  for (const p of postSeeds) {
    const author = userDocs[p.by];
    const existing = await Post.findOne({ author: author._id, caption: p.caption });
    if (existing) { postDocs.push(existing); continue; }
    const doc = await Post.create({
      author: author._id, college: author.collegeName, type: "photo", caption: p.caption,
      media: [{ url: mediaUrl("posts", p.img) }], hashtags: p.hashtags,
      createdAt: daysAgo(p.age / 24), updatedAt: daysAgo(p.age / 24), isDemoContent: true,
    });
    postDocs.push(doc);
    postsCreated++;
  }
  console.log(`[seed] posts: ${postsCreated} created, ${postDocs.length} total`);

  // ---- Reels ----
  let reelsCreated = 0;
  const reelDocs = [];
  for (const r of reelSeeds) {
    const author = userDocs[r.by];
    const existing = await Reel.findOne({ author: author._id, caption: r.caption });
    if (existing) { reelDocs.push(existing); continue; }
    const doc = await Reel.create({
      author: author._id, college: author.collegeName,
      videoUrl: mediaUrl("reels", r.video), thumbnailUrl: mediaUrl("thumbnails", r.thumb),
      duration: r.duration, caption: r.caption, audioName: r.audio, hashtags: r.hashtags,
      viewsCount: 3000 + Math.floor(Math.random() * 20000),
      isDemoContent: true,
    });
    reelDocs.push(doc);
    reelsCreated++;
  }
  console.log(`[seed] reels: ${reelsCreated} created, ${reelDocs.length} total`);

  // ---- Stories (image + text, mixed) ----
  let storiesCreated = 0;
  const storySeeds = [
    { by: 0, type: "image", img: "post-01.jpg", text: "Hackathon mode ON 💻" },
    { by: 1, type: "text", text: "Library grind 📚", bg: "#38BDF8" },
    { by: 3, type: "image", img: "post-05.jpg", text: "Good morning campus ☀️" },
    { by: 6, type: "text", text: "Coffee break ☕", bg: "#F5A524" },
    { by: 2, type: "image", img: "post-04.jpg", text: "Practice session 🤖" },
    { by: 12, type: "text", text: "Club meeting today!", bg: "#A855F7" },
  ];
  for (const s of storySeeds) {
    const author = userDocs[s.by];
    const existing = await Story.findOne({ author: author._id, textOverlay: s.text });
    if (existing) continue;
    await Story.create({
      author: author._id, college: author.collegeName, type: s.type,
      mediaUrl: s.type === "image" ? mediaUrl("posts", s.img) : undefined,
      textOverlay: s.text, backgroundColor: s.bg, expiresAt: Story.defaultExpiry(), isDemoContent: true,
    });
    storiesCreated++;
  }
  console.log(`[seed] stories: ${storiesCreated} created`);

  // ---- Clubs ----
  const clubDocs = [];
  for (const c of clubSeeds) {
    const doc = await Club.findOneAndUpdate(
      { name: c.name, college: c.college },
      {
        $setOnInsert: {
          name: c.name, college: c.college, description: c.desc,
          logo: { url: mediaUrl("clubs", c.img) },
          members: userDocs.filter((u) => u.collegeName === c.college).slice(0, 6).map((u) => u._id),
          admins: [userDocs.find((u) => u.collegeName === c.college)?._id].filter(Boolean),
          isDemoContent: true,
        },
      },
      { upsert: true, new: true }
    );
    clubDocs.push(doc);
  }
  console.log(`[seed] clubs: ${clubDocs.length} ready`);

  // ---- Events ----
  const eventDocs = [];
  for (const e of eventSeeds) {
    const doc = await Event.findOneAndUpdate(
      { title: e.title, college: e.college },
      {
        $setOnInsert: {
          title: e.title, college: e.college, venue: e.venue, organizer: `${e.college} Student Council`,
          description: `Demo event — ${e.title} at ${e.college}.`,
          image: { url: mediaUrl("events", e.img) },
          date: new Date(Date.now() + e.daysFromNow * 24 * 60 * 60 * 1000),
          participants: userDocs.filter((u) => u.collegeName === e.college).slice(0, 4).map((u) => u._id),
          isDemoContent: true,
        },
      },
      { upsert: true, new: true }
    );
    eventDocs.push(doc);
  }
  console.log(`[seed] events: ${eventDocs.length} ready`);

  // ---- Comments (spread across posts, avoid duplicate seeding) ----
  let commentsCreated = 0;
  for (let i = 0; i < postDocs.length; i++) {
    const post = postDocs[i];
    const already = await Comment.countDocuments({ target: post._id, targetTypeModel: "Post" });
    if (already > 0) continue;
    const commentCount = 1 + (i % 4);
    for (let c = 0; c < commentCount; c++) {
      const commenter = userDocs[(i + c + 1) % userDocs.length];
      const text = commentSeeds[(i * 3 + c) % commentSeeds.length];
      await Comment.create({ author: commenter._id, targetType: "post", target: post._id, targetTypeModel: "Post", text });
      commentsCreated++;
    }
    await Post.updateOne({ _id: post._id }, { commentsCount: commentCount });
  }
  console.log(`[seed] comments: ${commentsCreated} created`);

  // ---- Likes (deterministic pseudo-random spread) ----
  let likeOps = 0;
  for (let i = 0; i < postDocs.length; i++) {
    const post = postDocs[i];
    if (post.likes.length > 0) continue;
    const likers = userDocs.filter((_, idx) => (idx + i) % 3 !== 0).map((u) => u._id);
    await Post.updateOne({ _id: post._id }, { $set: { likes: likers } });
    likeOps++;
  }
  for (let i = 0; i < reelDocs.length; i++) {
    const reel = reelDocs[i];
    if (reel.likes.length > 0) continue;
    const likers = userDocs.filter((_, idx) => (idx + i) % 2 === 0).map((u) => u._id);
    await Reel.updateOne({ _id: reel._id }, { $set: { likes: likers } });
    likeOps++;
  }
  console.log(`[seed] like sets applied: ${likeOps}`);

  // ---- Follows ----
  let followsCreated = 0;
  for (let i = 0; i < userDocs.length; i++) {
    const follower = userDocs[i];
    const targets = [userDocs[(i + 1) % userDocs.length], userDocs[(i + 4) % userDocs.length]];
    for (const target of targets) {
      if (String(target._id) === String(follower._id)) continue;
      const res = await Follow.findOneAndUpdate(
        { follower: follower._id, following: target._id },
        { follower: follower._id, following: target._id },
        { upsert: true, new: true, rawResult: true }
      );
      if (res.lastErrorObject?.upserted) followsCreated++;
    }
  }
  await Promise.all(
    userDocs.map(async (u) => {
      const [followersCount, followingCount] = await Promise.all([
        Follow.countDocuments({ following: u._id }),
        Follow.countDocuments({ follower: u._id }),
      ]);
      await User.updateOne({ _id: u._id }, { followersCount, followingCount });
    })
  );
  console.log(`[seed] follows: ${followsCreated} created`);

  // ---- Connections (accepted, cross-college networking) ----
  const connectionPairs = [[0, 3], [2, 8], [4, 13], [6, 9], [10, 1]];
  let connectionsCreated = 0;
  for (const [a, b] of connectionPairs) {
    const requester = userDocs[a], recipient = userDocs[b];
    const existing = await Connection.findOne({ requester: requester._id, recipient: recipient._id });
    if (existing) continue;
    await Connection.create({ requester: requester._id, recipient: recipient._id, status: "accepted", context: "hackathon_team" });
    await User.updateOne({ _id: requester._id }, { $inc: { connectionsCount: 1 } });
    await User.updateOne({ _id: recipient._id }, { $inc: { connectionsCount: 1 } });
    connectionsCreated++;
  }
  console.log(`[seed] connections: ${connectionsCreated} created`);

  // ---- Matches + demo chat ----
  const matchPairs = [[0, 1], [2, 7], [4, 3]];
  let matchesCreated = 0;
  for (const [a, b] of matchPairs) {
    const uA = userDocs[a], uB = userDocs[b];
    let match = await Match.findOne({ users: { $all: [uA._id, uB._id] } });
    if (!match) {
      match = await Match.create({ users: [uA._id, uB._id], lastMessageAt: new Date() });
      matchesCreated++;
      const convo = [
        { from: uA, text: "Heyy! Excited we matched 🎉" },
        { from: uB, text: `Same! Saw you're into ${uA.interests?.[0] || "campus life"} too` },
        { from: uA, text: "Haha totally, we should team up for the next hackathon!" },
      ];
      for (const m of convo) {
        await Message.create({ match: match._id, sender: m.from._id, text: m.text, readBy: [m.from._id] });
      }
    }
  }
  console.log(`[seed] matches: ${matchesCreated} created`);

  // ---- Notifications ----
  let notifsCreated = 0;
  const notifTypes = ["like_post", "follow", "connection_request", "match", "comment_post"];
  for (let i = 0; i < 10; i++) {
    const user = userDocs[i % userDocs.length];
    const actor = userDocs[(i + 2) % userDocs.length];
    const type = notifTypes[i % notifTypes.length];
    const existing = await Notification.findOne({ user: user._id, actor: actor._id, type });
    if (existing) continue;
    await Notification.create({ user: user._id, actor: actor._id, type });
    notifsCreated++;
  }
  console.log(`[seed] notifications: ${notifsCreated} created`);

  console.log("\nCampusMate demo seed complete.");
  console.log("Demo logins (password: CampusMateDemo123!):");
  demoLogins.forEach((d) => console.log(`  ${d.email}`));

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
