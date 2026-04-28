import mongoose from 'mongoose';

await mongoose.connect('mongodb://localhost:27017/ticketing-portal');

const Ticket = mongoose.model('Ticket', new mongoose.Schema({}, {strict:false}));
const clientId = new mongoose.Types.ObjectId('69eee72c4dbbece657119ab4');

const results = await Ticket.find({
  $or: [
    { createdBy: clientId, type: 'client' },
    { targetClient: clientId, type: 'client' }
  ]
}).select('title type createdBy targetClient').lean();

console.log('Query results for client:', results.length, 'tickets');
console.log(JSON.stringify(results, null, 2));

process.exit(0);
