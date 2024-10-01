const axios = require("axios");

// const tlClient = axios.create({
//   baseURL: "https://api.textlocal.in/",
//   params: {
//     apiKey: "NDg2MjZhNjEzMjYzNTE0NjQxNjE0ODQyNDI3YTY2NmE=", //Text local api key
//     sender: "SUSASA"
//   }
// });

const apiKey = "NDg2MjZhNjEzMjYzNTE0NjQxNjE0ODQyNDI3YTY2NmE=" // YOUR API KEY HERE
const baseURL = "http://api.textlocal.in"

const smsClient = {
  sendPartnerWelcomeMessage: user => {
    if (user && user.phone && user.name) {
      const params = new URLSearchParams();
    //   const params = new URLSearchParams();
      params.append("apikey",apiKey);
      params.append("sender","TXTLCL");
      params.append("numbers", user.phone);
      params.append(
      "message",
     "Sds",
      );
      axios.post(baseURL+"/send/?"+params).then(res=>{console.log(res.data)})

    //   tlClient.post("/send", params);
    }
  },
  sendVerificationMessage: user => {
    if (user && user.phone) {
      const params = new URLSearchParams();
      params.append("numbers", [parseInt("91" + user.phone)]);
      params.append(
        "message",
        `Your iWheels verification code is ${user.verifyCode}`
      );
      tlClient.post("/send", params);
    }
  }
};

module.exports = smsClient;