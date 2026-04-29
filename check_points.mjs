import mongoose from 'mongoose';
import { Ticket, User } from './server/database.js';
import { POINT_VALUES, ELIGIBLE_ROLES, computeTier, TIER_RANK } from './server/gamification.js';

async function awardBugPoints(ticketId) {
  console.log("Calling awardBugPoints for", ticketId);
  const claim = await Ticket.findOneAndUpdate(
    { _id: ticketId, type: 'bug', status: 'completed', pointsAwarded: { $ne: true } },
    { $set: { pointsAwarded: true, pointsAwardedAt: new Date() } },
    { new: true }
  );
  if (!claim) {
    console.log("No claim found or already awarded");
    return null;
  }
  console.log("Claim successful:", claim._id);

  const reporter = await User.findById(claim.createdBy);
  if (!reporter || !ELIGIBLE_ROLES.includes(reporter.role)) {
    console.log("Reporter not found or ineligible role:", reporter?.role);
    return null;
  }
  console.log("Reporter eligible:", reporter.email);

  const amount = POINT_VALUES[claim.priority] || 0;
  claim.pointsAwardedAmount = amount;
  claim.pointsAwardedTo = reporter._id;
  claim.pointsAwardedPriority = claim.priority;
  await claim.save();

  reporter.points = (reporter.points || 0) + amount;
  console.log("Reporter new points:", reporter.points);
  
  await reporter.save();
  console.log("Saved reporter!");
}

async function check() {
  await mongoose.connect('mongodb+srv://runrkids_db_user:nO3rq3GEQgQVpN18@helpdeskportal.agnsl4f.mongodb.net/');
  const tickets = await Ticket.find({ type: 'bug', status: 'completed', pointsAwarded: false }).lean();
  for (const t of tickets) {
    await awardBugPoints(t._id);
  }
  process.exit(0);
}
check();
