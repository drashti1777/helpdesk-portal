import mongoose from 'mongoose';
import { Ticket, User } from './server/database.js';
import { POINT_VALUES, ELIGIBLE_ROLES, computeTier, TIER_RANK } from './server/gamification.js';

async function test() {
  await mongoose.connect('mongodb+srv://runrkids_db_user:nO3rq3GEQgQVpN18@helpdeskportal.agnsl4f.mongodb.net/');
  
  // Find employee and admin
  const emp = await User.findOne({ email: 'drashti.parmar@gmail.com' });
  
  // Create a new bug ticket
  const ticket = new Ticket({
    title: 'Test Bug by Script',
    description: 'Testing',
    type: 'bug',
    priority: 'low',
    status: 'pending',
    createdBy: emp._id
  });
  await ticket.save();
  console.log("Ticket created:", ticket._id);
  
  // Simulate the PUT route
  // The ticket is found
  const foundTicket = await Ticket.findById(ticket._id);
  
  // The admin updates it
  foundTicket.status = 'completed';
  foundTicket.updatedAt = Date.now();
  await foundTicket.save();
  
  console.log("Ticket updated, pointsAwarded is:", foundTicket.pointsAwarded);
  
  // Trigger awardBugPoints
  if (foundTicket.type === 'bug' && foundTicket.status === 'completed' && !foundTicket.pointsAwarded) {
    console.log("Condition matched! Calling awardBugPoints...");
    // Simulate awardBugPoints exactly as in index.js
    const claim = await Ticket.findOneAndUpdate(
      { _id: ticket._id, type: 'bug', status: 'completed', pointsAwarded: { $ne: true } },
      { $set: { pointsAwarded: true, pointsAwardedAt: new Date() } },
      { new: true }
    );
    if (claim) {
      console.log("Claim successful!");
    } else {
      console.log("Claim FAILED! findOneAndUpdate returned null");
    }
  }
  
  process.exit(0);
}
test();
