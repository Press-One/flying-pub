const router = require('koa-router')();
const {
  get,
  create,
  update,
  remove,
  listByUserAddress,
  addContribution,
  removeContribution,
  listContributionRequests,
  countPendingContributionRequests,
  addContributionRequest,
  removeContributionRequest,
  approveContributionRequest,
  rejectContributionRequest,
  listTopicPosts,
  addFollower,
  removeFollower,
  listFollowers,
  listFollowingTopicsByUserAddress,
  listAuthors,
  getPublicTopics
} = require('../controllers/apiTopic');

const {
  ensureAuthorization,
} = require('../middleware/api');

router.get('/contribution_requests', ensureAuthorization(), listContributionRequests);
router.get('/contribution_requests/pending_count', ensureAuthorization(), countPendingContributionRequests);
router.post('/:uuid/contribution_requests', ensureAuthorization(), addContributionRequest);
router.del('/:uuid/contribution_requests', ensureAuthorization(), removeContributionRequest);
router.post('/contribution_requests/:id/approve', ensureAuthorization(), approveContributionRequest);
router.post('/contribution_requests/:id/reject', ensureAuthorization(), rejectContributionRequest);

router.get('/public', ensureAuthorization({ strict: false }), getPublicTopics);
router.get('/:uuid', ensureAuthorization({ strict: false }), get);
router.post('/', ensureAuthorization(), create);
router.put('/:uuid', ensureAuthorization(), update);
router.del('/:uuid', ensureAuthorization(), remove);
router.get('/user/:userAddress', ensureAuthorization({ strict: false }), listByUserAddress);
router.get('/user/:userAddress/following', ensureAuthorization({ strict: false }), listFollowingTopicsByUserAddress);
router.post('/:uuid/contributions', ensureAuthorization(), addContribution);
router.del('/:uuid/contributions', ensureAuthorization(), removeContribution);
router.post('/:uuid/followers', ensureAuthorization(), addFollower);
router.del('/:uuid/followers', ensureAuthorization(), removeFollower);
router.get('/:uuid/posts', listTopicPosts);
router.get('/:uuid/followers', ensureAuthorization({ strict: false }), listFollowers);
router.get('/:uuid/authors', ensureAuthorization({ strict: false }), listAuthors);

module.exports = router;