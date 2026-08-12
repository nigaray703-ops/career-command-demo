import assert from 'node:assert/strict';
import {
  calculateDashboardStats,
  createApplication,
  restoreApplications,
  serializeApplications,
  updateApplication,
} from '../src/jobTrackerLogic.js';

const interview = createApplication({ id: 'interview', status: '面试' });
const finalRound = createApplication({ id: 'final', status: '终面' });
const directOffer = createApplication({ id: 'direct-offer', status: 'Offer' });
const interviewedOffer = createApplication({ id: 'interviewed-offer', status: 'Offer', everInterviewed: true });
const rejectedAfterInterview = createApplication({ id: 'rejected', status: '已拒', everInterviewed: true });

assert.equal(interview.everInterviewed, true, 'current Interview must force the historical milestone');
assert.equal(finalRound.everInterviewed, true, 'current Final must force the historical milestone');
assert.equal(directOffer.everInterviewed, false, 'Offer must not imply an interview');
assert.equal(interviewedOffer.everInterviewed, true, 'Offer may be manually marked as interviewed');
assert.equal(
  createApplication({ status: '已拒', everInterviewed: 'true' }).everInterviewed,
  false,
  'legacy strings must not be guessed as a true milestone',
);

const directOfferOnly = calculateDashboardStats([directOffer]);
assert.equal(directOfferOnly.interviewRate, 0, 'a direct Offer must not increase interview rate');
assert.equal(directOfferOnly.statusCounts.Offer, 1, 'the direct Offer remains one current Offer');
assert.equal(directOfferOnly.interviewCount, 0, 'the current Interview count stays exclusive');

const records = [interview, finalRound, directOffer, interviewedOffer, rejectedAfterInterview];
const stats = calculateDashboardStats(records);
assert.equal(stats.statusCounts['面试'], 1, 'only the current Interview record counts as Interview');
assert.equal(stats.statusCounts.Offer, 2, 'both Offers count once as current Offers');
assert.equal(stats.interviewCount, 1, 'Interview count must equal the exact current status count');
assert.equal(stats.everInterviewedCount, 4, 'historical count includes Interview, Final, interviewed Offer, and rejected-after-interview');
assert.equal(stats.interviewRate, 80, 'historical interview rate uses the milestone over total applications');

const movedToRejected = updateApplication([interview], 'interview', { status: '已拒' })[0];
assert.equal(movedToRejected.everInterviewed, true, 'Interview to Rejected must preserve the milestone automatically');
assert.equal(calculateDashboardStats([movedToRejected]).interviewRate, 100);
assert.equal(calculateDashboardStats([movedToRejected]).interviewCount, 0);

const movedToOffer = updateApplication([interview], 'interview', { status: 'Offer' })[0];
assert.equal(movedToOffer.everInterviewed, true, 'Interview to Offer must preserve the milestone automatically');
assert.equal(calculateDashboardStats([movedToOffer]).statusCounts.Offer, 1);
assert.equal(calculateDashboardStats([movedToOffer]).interviewCount, 0);
assert.equal(calculateDashboardStats([movedToOffer]).interviewRate, 100);

const manuallyCorrected = updateApplication([movedToRejected], 'interview', { everInterviewed: false })[0];
assert.equal(manuallyCorrected.everInterviewed, false, 'an editable non-interview status may be manually corrected');

const restored = restoreApplications(serializeApplications([interviewedOffer]), []);
assert.equal(restored[0].everInterviewed, true, 'serialization and restore must preserve the milestone');

console.log('historical interview milestone tests passed');
