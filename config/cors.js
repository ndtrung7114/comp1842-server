const allowedOrigins = require("./allowed_origins");

// const corsOptions = {
//   origin: (origin, callback) => {
//     if(allowedOrigins.includes(origin) || !origin){
//       callback(null, true)
//     }else{
//       callback(new Error('Not allowed by CORS'))
//     }
//   }
// }

const corsOptions = {
  origin: "https://greenwichsocial.vercel.app/",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

module.exports = corsOptions;
