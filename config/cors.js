const allowedOrigins = require("./allowed_origins");

// CORS options
const corsOptions = {
  origin: "https://greenwichsocial.vercel.app", // only allow this domain to make requests
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

module.exports = corsOptions;
