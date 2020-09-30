const router = require("koa-router")();
const config = require("../config");
const {
  ensureAuthorization
} = require("../middleware/api");

const tokenHandler = async (ctx) => {
  ctx.body = {
    [config.auth.tokenKey]: ctx.verification.token
  };
};

router.get("/", ensureAuthorization(), tokenHandler);

module.exports = router;