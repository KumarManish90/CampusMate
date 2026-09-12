const { Connection, Match } = require("../models/Social");

async function connectedUserIds(userId) {
  if (!userId) return [];

  const [connections, matches] = await Promise.all([
    Connection.find({
      status: "accepted",
      $or: [{ requester: userId }, { recipient: userId }],
    }).select("requester recipient"),
    Match.find({ users: userId, isActive: true }).select("users"),
  ]);

  const ids = new Set();
  for (const connection of connections) {
    const peer = String(connection.requester) === String(userId) ? connection.recipient : connection.requester;
    ids.add(String(peer));
  }
  for (const match of matches) {
    for (const member of match.users) {
      if (String(member) !== String(userId)) ids.add(String(member));
    }
  }
  return [...ids];
}

function visibilityRules(viewer, peerIds = []) {
  if (!viewer) return { visibility: "public" };
  const rules = [
    { author: viewer._id },
    { visibility: "public" },
    { visibility: "campus" },
  ];

  if (viewer.collegeName) rules.push({ visibility: "college", college: viewer.collegeName });
  if (peerIds.length) rules.push({ visibility: "connections", author: { $in: peerIds } });

  return { $or: rules };
}

async function visibilityFilter(viewer) {
  if (!viewer) return visibilityRules(null);
  return visibilityRules(viewer, await connectedUserIds(viewer._id));
}

async function visibleQuery(baseQuery, viewer) {
  return { $and: [baseQuery, await visibilityFilter(viewer)] };
}

module.exports = { visibleQuery, visibilityFilter, visibilityRules };
