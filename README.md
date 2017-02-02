# Waze Tools
Waze projects for the community. This tools are tested and developed using Chrome

Most of them needs the [Tempermonkey Chrome plugin](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)

---

## [unready](unready/unready.js) [TM plugin]
- [Unready Events](https://www.waze.com/events/unready) page don't show events location, this'll add it, in *red* 
![unready example][unready]


 Add this URL to your Tampermonkey:

 ```
 http://dbcm.github.io/waze/unready/unready.js
 ```

---

## [blame](blame/blame.js) [copy&past javascript console (TM maybe)]
- Time to time we need to understant what happened in a specific area, usually lock with higher level
- like git blame, with this script we can understand what happened, how did what...
![blame example][blame]


 Copy the content of this script to the javascript console (change user ids and names):

 ```
 http://dbcm.github.io/waze/blame/blame.js
 ```


[unready]: unready/unready.png
[blame]: blame/blame.png
