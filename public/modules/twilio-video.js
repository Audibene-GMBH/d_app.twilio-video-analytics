const { AccessToken } = require("twilio").jwt;
const names = require("docker-names");
const chance = require("chance").Chance();

let credentials = null;

function getAccessToken(user_name, room) {
  if (!credentials) return null;

  let accessToken = new AccessToken(
    credentials.acc_sid,
    credentials.api_key,
    credentials.api_sec
  );
  accessToken.identity = user_name;

  let grant = new AccessToken.VideoGrant();
  grant.room = room || "Teleaudiology Lab Room";
  accessToken.addGrant(grant);

  let jwt = accessToken.toJwt();
  return { access_token: jwt, room_name: grant.room };
}

function setCredentials(cred) {
  credentials = cred;
}

const generateRoomName = () => {
  return names.getRandomName(true);
};

const generateParticipantName = () => {
  return chance.name({
    middle: true,
    prefix: true,
  });
};

module.exports = {
  getAccessToken,
  setCredentials,
  generateRoomName,
  generateParticipantName,
};
