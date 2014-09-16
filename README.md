Cipher.io Groups Server
================

Cipher.io Groups is a secure messaging platform that utilizes 256-bit AES encrypted before leaving the app, on top of traditional SSL. Messages snooped on WIFI, or obtained through the server database are still safe. Access to a group (and AES key) is granted via a physical NFC "tap" with other privileges.

More information on AES available [here](http://en.wikipedia.org/wiki/Advanced_Encryption_Standard "Here").

##In development##

To make this easier to make I am just creating a polling chat server. There needs to be 2 versions eventually though, self-hosted and cipher.io with extra features. I want to keep this self-hosted version relatively simple so installation will always be easy (with some options for advanced features). Currently I am not sure what features to leave out of the self-hosted version (push notifications/caching/cdn).

---

##Todo##

- public rooms?
- protection against abuse
- hook up topic changing
- log some group activity for cleanup
- account changing (password/nickname)
- notifications (who is doing what aka setting topic)
- group admin stuff (user kicking/changing name)
- get past posts
- (small) picture uploading
- save images to CDN (s3) or ./static folder..
- some better security (login attempts/ban)
- don't assume UUID unique since I am using a random generator
- caching
- group events

##Eventually##

- Push Notifications

