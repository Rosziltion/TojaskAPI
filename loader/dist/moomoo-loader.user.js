
// ==UserScript==
// @name         moomoo.js Loader
// @namespace    moomoo.js
// @version      1.3.4
// @description  moomoo.js mod loader — hooks the game socket and exposes window.MooMoo for mods.
// @author       al007ex
// @match        *://*/*
// @run-at       document-start
// @inject-into  page
// @grant        none
// ==/UserScript==

(function bootstrap() {
  function core() {
    "use strict";

    try {
      var present = false;
      window.dispatchEvent(new CustomEvent("moomoo.js:api", { detail: { resolve: function () { present = true; } } }));
      if (present) return;
    } catch (e) {}

    var __ns = {};
    (function (self, globalThis, module, exports, require) {
      /* ===== module: vocabulary (shared/vocabulary.js) ===== */
      (function (root, factory) {
        const value = factory();
        if (typeof module === "object" && module.exports) module.exports = value;
        if (typeof root !== "undefined") root.MooMooVocabulary = value;
        if (typeof globalThis !== "undefined") globalThis.MooMooVocabulary = value;
      })(typeof self !== "undefined" ? self : this, function () {
        "use strict";

        const p = (name, type, desc) => ({ name, type, desc });

        const EVENTS = {
          setup: { summary: "You joined / spawned. Carries YOUR own player slot id (sid).", normalized: true, params: [p("sid", "number", "your own player slot id")] },
          init: { summary: "Initial game data sent right after connecting.", normalized: false, params: [p("data", "any", "raw init payload")] },
          disconnect: { summary: "The server is dropping you. Carries a reason string.", normalized: true, params: [p("reason", "string", "why you were disconnected")] },
          health: { summary: "A player's health changed.", normalized: true, params: [p("sid", "number", "whose health changed"), p("value", "number", "the new health value")] },
          playerAdd: { summary: "A player entered your view (or you spawned).", normalized: true, params: [p("data", "array", "raw player data array"), p("isYou", "boolean", "true if this player is you")] },
          playerRemove: { summary: "A player left your view.", normalized: true, params: [p("sid", "number", "the player that left")] },
          playersUpdate: {
            summary: "Per-tick movement + attribute update for everyone in view.",
            normalized: true,
            params: [
              p("positions", "array", "[{sid,x,y,dir}] current positions"),
              p("attributes", "array", "[{sid,buildIndex,weaponIndex,variant,team,isLeader,skin,tail,icon,zIndex}]"),
              p("hidden", "array", "sids that are no longer visible")
            ]
          },
          playerValue: {
            summary: "A named value about you changed (points, kills, wood, food, ...).",
            normalized: true,
            params: [p("key", "string", "which value"), p("value", "number", "new value"), p("updateView", "boolean", "flash HUD")]
          },
          health_regen: { summary: "(reserved)", normalized: false, params: [p("args", "array", "raw arguments")], hidden: true },
          upgrades: { summary: "Your available upgrade points / current upgrade age.", normalized: true, params: [p("points", "number", "upgrade points"), p("age", "number", "upgrade age")] },
          inventory: { summary: "Your item list or weapon list was replaced.", normalized: true, params: [p("list", "array", "ids owned"), p("isWeapon", "boolean", "true = weapons, false = items")] },
          age: { summary: "Your XP / age progress.", normalized: false, params: [p("args", "array", "[xp, maxXp?, age?]")] },
          died: { summary: "You died. No payload.", normalized: true, params: [] },
          chat: { summary: "A chat message was said by a player.", normalized: true, params: [p("sid", "number", "who said it"), p("message", "string", "chat text")] },
          showText: { summary: "Floating world text.", normalized: true, params: [p("x", "number", "x"), p("y", "number", "y"), p("value", "number", "val"), p("type", "number", "type")] },
          mapPing: { summary: "A teammate pinged the map.", normalized: true, params: [p("x", "number", "ping x"), p("y", "number", "ping y")] },
          leaderboard: { summary: "Leaderboard refresh.", normalized: false, params: [p("args", "array", "raw arguments")] },
          objectsLoad: { summary: "New world objects entered view.", normalized: false, params: [p("args", "array", "raw arguments")] },
          animalsUpdate: { summary: "Animal/AI movement + state update.", normalized: false, params: [p("args", "array", "raw arguments")] },
          animalAttack: { summary: "An animal played its attack animation.", normalized: false, params: [p("args", "array", "raw arguments")] },
          gatherAnimation: { summary: "A player played a gather/attack swing.", normalized: false, params: [p("args", "array", "raw arguments")] },
          wiggle: { summary: "An object wiggled (was hit).", normalized: false, params: [p("args", "array", "raw arguments")] },
          turretShoot: { summary: "A turret fired.", normalized: false, params: [p("args", "array", "raw arguments")] },
          objectKilled: { summary: "One object was destroyed.", normalized: false, params: [p("args", "array", "raw arguments")] },
          objectsKilled: { summary: "Several objects were destroyed.", normalized: false, params: [p("args", "array", "raw arguments")] },
          itemCount: { summary: "Placed-item count changed.", normalized: false, params: [p("args", "array", "raw arguments")] },
          projectileAdd: { summary: "A projectile spawned.", normalized: false, params: [p("args", "array", "raw arguments")] },
          projectileRemove: { summary: "A projectile despawned.", normalized: false, params: [p("args", "array", "raw arguments")] },
          shutdownNotice: { summary: "Server shutdown countdown.", normalized: false, params: [p("args", "array", "raw arguments")] },
          tribeAdd: { summary: "A tribe was created.", normalized: false, params: [p("args", "array", "raw arguments")] },
          tribeDelete: { summary: "A tribe was deleted.", normalized: false, params: [p("args", "array", "raw arguments")] },
          tribeJoinRequest: { summary: "Someone asked to join your tribe.", normalized: false, params: [p("args", "array", "raw arguments")] },
          tribeSet: { summary: "Your tribe membership changed.", normalized: false, params: [p("args", "array", "raw arguments")] },
          tribeMembers: { summary: "Your tribe's member list.", normalized: false, params: [p("args", "array", "raw arguments")] },
          storeUpdate: { summary: "A hat/accessory was bought or equipped.", normalized: false, params: [p("args", "array", "raw arguments")] },
          minimap: { summary: "Minimap dots for your tribe.", normalized: false, params: [p("args", "array", "raw arguments")] },
          pong: { summary: "Reply to your ping.", normalized: true, params: [] },
          effect: { summary: "A visual effect was triggered.", normalized: false, params: [p("args", "array", "raw arguments")] },
          stats: { summary: "Live stats card for a watched player.", normalized: false, params: [p("args", "array", "raw arguments")] },
          profile: { summary: "A player's profile card.", normalized: false, params: [p("args", "array", "raw arguments")] },
          probes: { summary: "Server integrity probes.", normalized: true, params: [p("salt", "number", "salt"), p("probes", "array", "checks")] },
          updateCountdown: { summary: "Countdown to forced reload.", normalized: false, params: [p("args", "array", "raw arguments")] },
          dive: { summary: "A player dived under / surfaced.", normalized: true, params: [p("sid", "number", "sid"), p("state", "number", "dive state")] }
        };

        const ACTIONS = {
          spawn: { summary: "Spawn into the game.", params: [p("name", "string", "name"), p("moofoll", "boolean", "moofoll"), p("skin", "number", "skin")] },
          aim: { summary: "Face a direction (radians).", params: [p("dir", "number", "aim angle")] },
          move: { summary: "Move in a direction (radians), or null to stop.", params: [p("dir", "number", "move angle")] },
          stopMove: { summary: "Stop moving.", params: [] },
          mouse: { summary: "Press/release attack/place.", params: [p("down", "boolean", "held"), p("dir", "number", "dir")] },
          selectItem: { summary: "Select weapon or item.", params: [p("index", "number", "id"), p("isWeapon", "boolean", "isWeapon")] },
          upgrade: { summary: "Choose an upgrade.", params: [p("index", "number", "index")] },
          toggle: { summary: "Toggle 0=lock rotation, 1=auto gather.", params: [p("which", "number", "which")] },
          createTribe: { summary: "Create a tribe.", params: [p("name", "string", "name")] },
          leaveTribe: { summary: "Leave your tribe.", params: [] },
          joinTribe: { summary: "Ask to join a tribe.", params: [p("name", "string", "name")] },
          answerJoin: { summary: "Accept/deny join request.", params: [p("sid", "number", "sid"), p("accept", "boolean", "accept")] },
          kickMember: { summary: "Kick a tribe member.", params: [p("sid", "number", "sid")] },
          store: { summary: "Buy (0) or equip (1) hat/accessory.", params: [p("action", "number", "action"), p("id", "number", "id"), p("isAccessory", "boolean", "isAccessory")] },
          chat: { summary: "Say something in chat.", params: [p("message", "string", "message")] },
          pingMap: { summary: "Ping the map.", params: [] },
          ping: { summary: "Latency probe.", params: [] },
          watchStats: { summary: "Watch player stats.", params: [p("sid", "number", "sid")] },
          report: { summary: "Report action.", params: [p("args", "array", "args")], advanced: true },
          admin: { summary: "Admin command.", params: [p("args", "array", "args")], advanced: true },
          anon: { summary: "Anonymous mode.", params: [p("on", "boolean", "on")] }
        };

        return {
          version: 1,
          events: EVENTS,
          actions: ACTIONS,
          eventNames: Object.keys(EVENTS).filter((k) => !EVENTS[k].hidden),
          actionNames: Object.keys(ACTIONS),
          isEvent: (name) => Object.prototype.hasOwnProperty.call(EVENTS, name) && !EVENTS[name].hidden,
          isAction: (name) => Object.prototype.hasOwnProperty.call(ACTIONS, name)
        };
      });

      /* ===== module: gamedata (shared/gamedata.js) ===== */
      (function (root, factory) {
        const value = factory();
        if (typeof module === "object" && module.exports) module.exports = value;
        if (typeof root !== "undefined") root.MooMooGameData = value;
        if (typeof globalThis !== "undefined") globalThis.MooMooGameData = value;
      })(typeof self !== "undefined" ? self : this, function () {
        "use strict";

        const groups = [
          { id: 0, name: "food", layer: 0 },
          { id: 1, name: "walls", place: true, limit: 30, layer: 0 },
          { id: 2, name: "spikes", place: true, limit: 15, layer: 0 },
          { id: 3, name: "mill", place: true, limit: 7, sandboxLimit: 299, layer: 1 },
          { id: 4, name: "mine", place: true, limit: 1, layer: 0 },
          { id: 5, name: "trap", place: true, limit: 6, layer: -1 },
          { id: 6, name: "booster", place: true, limit: 12, sandboxLimit: 299, layer: -1 },
          { id: 7, name: "turret", place: true, limit: 2, layer: 1 },
          { id: 8, name: "watchtower", place: true, limit: 12, layer: 1 },
          { id: 9, name: "buff", place: true, limit: 4, layer: -1 },
          { id: 10, name: "spawn", place: true, limit: 1, layer: -1 },
          { id: 11, name: "sapling", place: true, limit: 2, layer: 0 },
          { id: 12, name: "blocker", place: true, limit: 3, layer: -1 },
          { id: 13, name: "teleporter", place: true, limit: 2, sandboxLimit: 299, layer: -1 }
        ];

        const projectiles = [
          { indx: 0, layer: 0, src: "arrow_1", dmg: 25, speed: 1.6, scale: 103, range: 1000 },
          { indx: 1, layer: 1, dmg: 25, speed: 1.5, scale: 20 },
          { indx: 0, layer: 0, src: "arrow_1", dmg: 35, speed: 2.5, scale: 103, range: 1200 },
          { indx: 0, layer: 0, src: "arrow_1", dmg: 30, speed: 2, scale: 103, range: 1200 },
          { indx: 1, layer: 1, dmg: 16, scale: 20 },
          { indx: 0, layer: 0, src: "bullet_1", dmg: 50, speed: 3.6, scale: 160, range: 1400 }
        ];

        const weapons = [
          { id: 0, type: 0, spdMult: 1, uF: [], name: "tool hammer", desc: "tool for gathering all resources", src: "hammer_1", length: 140, width: 140, xOff: -3, yOff: 18, dmg: 25, range: 65, gather: 1, speed: 300 },
          { id: 1, type: 0, uF: [0], age: 2, name: "hand axe", desc: "gathers resources at a higher rate", src: "axe_1", length: 140, width: 140, xOff: 3, yOff: 24, dmg: 30, spdMult: 1, range: 70, gather: 2, speed: 400 },
          { id: 2, type: 0, uF: [1, 0, 15, 12, 13, null], age: 8, pre: 1, name: "great axe", desc: "deal more damage and gather more resources", src: "great_axe_1", length: 140, width: 140, xOff: -8, yOff: 25, dmg: 35, spdMult: 1, range: 75, gather: 4, speed: 400 },
          { id: 3, type: 0, uF: [0, 4], age: 2, name: "short sword", desc: "increased attack power but slower move speed", src: "sword_1", iPad: 1.3, length: 130, width: 210, xOff: -8, yOff: 46, dmg: 35, spdMult: 0.85, range: 110, gather: 1, speed: 300 },
          { id: 4, type: 0, uF: [3, 0, 15, 12, 13, null, 9], age: 8, pre: 3, name: "katana", desc: "greater range and damage", src: "samurai_1", iPad: 1.3, length: 130, width: 210, xOff: -8, yOff: 59, dmg: 40, spdMult: 0.8, range: 118, gather: 1, speed: 300 },
          { id: 5, type: 0, uF: [0], age: 2, name: "polearm", desc: "long range melee weapon", src: "spear_1", iPad: 1.3, length: 130, width: 210, xOff: -8, yOff: 53, dmg: 45, knock: 0.2, spdMult: 0.82, range: 142, gather: 1, speed: 700 },
          { id: 6, type: 0, spdMult: 1, uF: [0], age: 2, name: "bat", desc: "fast long range melee weapon", src: "bat_1", iPad: 1.3, length: 110, width: 180, xOff: -8, yOff: 53, dmg: 20, knock: 0.7, range: 110, gather: 1, speed: 300 },
          { id: 7, type: 0, uF: [0], age: 2, name: "daggers", desc: "really fast short range weapon", src: "dagger_1", iPad: 0.8, length: 110, width: 110, xOff: 18, yOff: 0, dmg: 20, knock: 0.1, range: 65, gather: 1, hitSlow: 0.1, spdMult: 1.13, speed: 100 },
          { id: 8, type: 0, uF: [0], age: 2, name: "stick", desc: "great for gathering but very weak", src: "stick_1", length: 140, width: 140, xOff: 3, yOff: 24, dmg: 1, spdMult: 1, range: 70, gather: 7, speed: 400 },
          { id: 9, type: 1, dmg: 25, projSpd: 1.6, uF: [null], age: 6, name: "hunting bow", desc: "bow used for ranged combat and hunting", src: "bow_1", req: ["wood", 4], length: 120, width: 120, xOff: -6, yOff: 0, projectile: 0, spdMult: 0.75, speed: 600 },
          { id: 10, type: 1, uF: [null], age: 6, name: "great hammer", desc: "hammer used for destroying structures", src: "great_hammer_1", length: 140, width: 140, xOff: -9, yOff: 25, dmg: 10, spdMult: 0.88, range: 75, sDmg: 7.5, gather: 1, speed: 400 },
          { id: 11, type: 1, dmg: 0, speed: 1, uF: [null], age: 6, name: "wooden shield", desc: "blocks projectiles and reduces melee damage", src: "shield_1", length: 120, width: 120, shield: 0.2, xOff: 6, yOff: 0, spdMult: 0.7 },
          { id: 12, type: 1, dmg: 35, projSpd: 2.5, uF: [9, null, 4], age: 8, pre: 9, name: "crossbow", desc: "deals more damage and has greater range", src: "crossbow_1", req: ["wood", 5], aboveHand: true, armS: 0.75, length: 120, width: 120, xOff: -4, yOff: 0, projectile: 2, spdMult: 0.7, speed: 700 },
          { id: 13, type: 1, dmg: 30, projSpd: 2, uF: [12, 9, null, 4, 2], age: 9, pre: 12, name: "repeater crossbow", desc: "high firerate crossbow with reduced damage", src: "crossbow_2", req: ["wood", 10], aboveHand: true, armS: 0.75, length: 120, width: 120, xOff: -4, yOff: 0, projectile: 3, spdMult: 0.7, speed: 230 },
          { id: 14, type: 1, uF: [null], age: 6, name: "mc grabby", desc: "steals resources from enemies", src: "grab_1", length: 130, width: 210, xOff: -8, yOff: 53, dmg: 0, steal: 250, knock: 0.2, spdMult: 1.05, range: 125, gather: 0, speed: 700 },
          { id: 15, type: 1, dmg: 50, projSpd: 3.6, uF: [12, 9, null, 4, 2], age: 9, pre: 12, name: "musket", desc: "slow firerate but high damage and range", src: "musket_1", req: ["stone", 10], aboveHand: true, rec: 0.35, armS: 0.6, hndS: 0.3, hndD: 1.6, length: 205, width: 205, xOff: 25, yOff: 0, projectile: 5, hideProjectile: true, spdMult: 0.6, speed: 1500 }
        ];

        const items = [
          { group: 0, name: "apple", desc: "restores 20 health when consumed", req: ["food", 10], heal: 20, scale: 22, holdOffset: 15 },
          { age: 3, group: 0, name: "cookie", desc: "restores 40 health when consumed", req: ["food", 15], heal: 40, scale: 27, holdOffset: 15 },
          { age: 7, group: 0, name: "cheese", desc: "restores 30 health and another 50 over 5 seconds", req: ["food", 25], heal: 30, scale: 27, holdOffset: 15 },
          { group: 1, name: "wood wall", desc: "provides protection for your village", req: ["wood", 10], projDmg: true, health: 380, scale: 50, holdOffset: 20, placeOffset: -5 },
          { age: 3, group: 1, name: "stone wall", desc: "provides improved protection for your village", req: ["stone", 25], health: 900, scale: 50, holdOffset: 20, placeOffset: -5 },
          { age: 7, pre: 1, group: 1, name: "castle wall", desc: "provides powerful protection for your village", req: ["stone", 35], health: 1500, scale: 52, holdOffset: 20, placeOffset: -5 },
          { group: 2, name: "spikes", desc: "damages enemies when they touch them", req: ["wood", 20, "stone", 5], health: 400, dmg: 20, scale: 49, spritePadding: -23, holdOffset: 8, placeOffset: -5 },
          { age: 5, group: 2, name: "greater spikes", desc: "damages enemies when they touch them", req: ["wood", 30, "stone", 10], health: 500, dmg: 35, scale: 52, spritePadding: -23, holdOffset: 8, placeOffset: -5 },
          { age: 9, pre: 1, group: 2, name: "poison spikes", desc: "poisons enemies when they touch them", req: ["wood", 35, "stone", 15], health: 600, dmg: 30, pDmg: 5, scale: 52, spritePadding: -23, holdOffset: 8, placeOffset: -5 },
          { age: 9, pre: 2, group: 2, name: "spinning spikes", desc: "damages enemies when they touch them", req: ["wood", 30, "stone", 20], health: 500, dmg: 45, turnSpeed: 0.003, scale: 52, spritePadding: -23, holdOffset: 8, placeOffset: -5 },
          { group: 3, name: "windmill", desc: "generates gold over time", req: ["wood", 50, "stone", 10], health: 400, pps: 1, turnSpeed: 0.0016, spritePadding: 25, iconLineMult: 12, scale: 45, holdOffset: 20, placeOffset: 5 },
          { age: 5, pre: 1, group: 3, name: "faster windmill", desc: "generates more gold over time", req: ["wood", 60, "stone", 20], health: 500, pps: 1.5, turnSpeed: 0.0025, spritePadding: 25, iconLineMult: 12, scale: 47, holdOffset: 20, placeOffset: 5 },
          { age: 8, pre: 1, group: 3, name: "power mill", desc: "generates more gold over time", req: ["wood", 100, "stone", 50], health: 800, pps: 2, turnSpeed: 0.005, spritePadding: 25, iconLineMult: 12, scale: 47, holdOffset: 20, placeOffset: 5 },
          { age: 5, group: 4, type: 2, name: "mine", desc: "allows you to mine stone", req: ["wood", 20, "stone", 100], iconLineMult: 12, scale: 65, holdOffset: 20, placeOffset: 0 },
          { age: 5, group: 11, type: 0, name: "sapling", desc: "allows you to farm wood", req: ["wood", 150], iconLineMult: 12, colDiv: 0.5, scale: 110, holdOffset: 50, placeOffset: -15 },
          { age: 4, group: 5, name: "pit trap", desc: "pit that traps enemies if they walk over it", req: ["wood", 30, "stone", 30], trap: true, ignoreCollision: true, hideFromEnemy: true, health: 500, colDiv: 0.2, scale: 50, holdOffset: 20, placeOffset: -5 },
          { age: 4, group: 6, name: "boost pad", desc: "provides boost when stepped on", req: ["stone", 20, "wood", 5], ignoreCollision: true, boostSpeed: 1.5, health: 150, colDiv: 0.7, scale: 45, holdOffset: 20, placeOffset: -5 },
          { age: 7, group: 7, doUpdate: true, name: "turret", desc: "defensive structure that shoots at enemies", req: ["wood", 200, "stone", 150], health: 800, projectile: 1, shootRange: 700, shootRate: 2200, scale: 43, holdOffset: 20, placeOffset: -5 },
          { age: 7, group: 8, name: "platform", desc: "platform to shoot over walls and cross over water", req: ["wood", 20], ignoreCollision: true, zIndex: 1, health: 300, scale: 43, holdOffset: 20, placeOffset: -5 },
          { age: 7, group: 9, name: "healing pad", desc: "standing on it will slowly heal you", req: ["wood", 30, "food", 10], ignoreCollision: true, healCol: 15, health: 400, colDiv: 0.7, scale: 45, holdOffset: 20, placeOffset: -5 },
          { age: 9, group: 10, name: "spawn pad", desc: "you will spawn here when you die but it will dissapear", req: ["wood", 100, "stone", 100], health: 400, ignoreCollision: true, spawnPoint: true, scale: 45, holdOffset: 20, placeOffset: -5 },
          { age: 7, group: 12, name: "blocker", desc: "blocks building in radius", req: ["wood", 30, "stone", 25], ignoreCollision: true, blocker: 300, health: 400, colDiv: 0.7, scale: 45, holdOffset: 20, placeOffset: -5 },
          { age: 7, group: 13, name: "teleporter", desc: "teleports you to a random point on the map", req: ["wood", 60, "stone", 60], ignoreCollision: true, teleport: true, health: 200, colDiv: 0.7, scale: 45, holdOffset: 20, placeOffset: -5 }
        ];

        for (let i = 0; i < items.length; i++) {
          items[i].id = i;
          items[i].group = groups[items[i].group];
          if (items[i].pre) items[i].pre = i - items[i].pre;
        }

        const hats = [
          { id: 45, name: "Shame!", dontSell: true, price: 0, scale: 120, desc: "hacks are for losers" },
          { id: 51, name: "Moo Cap", price: 0, scale: 120, desc: "coolest mooer around" },
          { id: 50, name: "Apple Cap", price: 0, scale: 120, desc: "apple farms remembers" },
          { id: 28, name: "Moo Head", price: 0, scale: 120, desc: "no effect" },
          { id: 29, name: "Pig Head", price: 0, scale: 120, desc: "no effect" },
          { id: 30, name: "Fluff Head", price: 0, scale: 120, desc: "no effect" },
          { id: 36, name: "Pandou Head", price: 0, scale: 120, desc: "no effect" },
          { id: 37, name: "Bear Head", price: 0, scale: 120, desc: "no effect" },
          { id: 38, name: "Monkey Head", price: 0, scale: 120, desc: "no effect" },
          { id: 44, name: "Polar Head", price: 0, scale: 120, desc: "no effect" },
          { id: 35, name: "Fez Hat", price: 0, scale: 120, desc: "no effect" },
          { id: 42, name: "Enigma Hat", price: 0, scale: 120, desc: "join the enigma army" },
          { id: 43, name: "Blitz Hat", price: 0, scale: 120, desc: "hey everybody i'm blitz" },
          { id: 49, name: "Bob XIII Hat", price: 0, scale: 120, desc: "like and subscribe" },
          { id: 57, name: "Pumpkin", price: 50, scale: 120, desc: "Spooooky" },
          { id: 8, name: "Bummle Hat", price: 100, scale: 120, desc: "no effect" },
          { id: 2, name: "Straw Hat", price: 500, scale: 120, desc: "no effect" },
          { id: 15, name: "Winter Cap", price: 600, scale: 120, desc: "allows you to move at normal speed in snow", coldM: 1 },
          { id: 5, name: "Cowboy Hat", price: 1000, scale: 120, desc: "no effect" },
          { id: 4, name: "Ranger Hat", price: 2000, scale: 120, desc: "no effect" },
          { id: 18, name: "Explorer Hat", price: 2000, scale: 120, desc: "no effect" },
          { id: 31, name: "Flipper Hat", price: 2500, scale: 120, desc: "have more control while in water", watrImm: true },
          { id: 1, name: "Marksman Cap", price: 3000, scale: 120, desc: "increases arrow speed and range", aMlt: 1.3 },
          { id: 10, name: "Bush Gear", price: 3000, scale: 160, desc: "allows you to disguise yourself as a bush" },
          { id: 48, name: "Halo", price: 3000, scale: 120, desc: "no effect" },
          { id: 6, name: "Soldier Helmet", price: 4000, scale: 120, desc: "reduces damage taken but slows movement", spdMult: 0.94, dmgMult: 0.75 },
          { id: 59, name: "Scout Hat", price: 3500, scale: 120, desc: "move faster but take more damage", spdMult: 1.08, dmgMult: 1.12 },
          { id: 23, name: "Anti Venom Gear", price: 4000, scale: 120, desc: "makes you immune to poison", poisonRes: 1 },
          { id: 13, name: "Medic Gear", price: 5000, scale: 110, desc: "slowly regenerates health over time", healthRegen: 3 },
          { id: 9, name: "Miners Helmet", price: 5000, scale: 120, desc: "earn 1 extra gold per resource", extraGold: 1 },
          { id: 32, name: "Musketeer Hat", price: 5000, scale: 120, desc: "reduces cost of projectiles", projCost: 0.5 },
          { id: 7, name: "Bull Helmet", price: 6000, scale: 120, desc: "increases damage done but drains health", healthRegen: -5, dmgMultO: 1.5, spdMult: 0.96 },
          { id: 22, name: "Emp Helmet", price: 6000, scale: 120, desc: "turrets won't attack but you move slower", antiTurret: 1, spdMult: 0.7 },
          { id: 12, name: "Booster Hat", price: 6000, scale: 120, desc: "increases your movement speed", spdMult: 1.16 },
          { id: 26, name: "Barbarian Armor", price: 8000, scale: 120, desc: "knocks back enemies that attack you", dmgK: 0.6 },
          { id: 60, name: "Frost Helm", price: 7000, scale: 120, desc: "normal speed in snow and reduces damage taken", coldM: 1, spdMult: 0.94, dmgMult: 0.88 },
          { id: 61, name: "Crab Shell", dontSell: true, earned: true, price: 0, scale: 120, desc: "dropped by the Crab King. reflects damage and reduces damage taken", dmg: 0.3, dmgMult: 0.85, spdMult: 0.92 },
          { id: 21, name: "Plague Mask", price: 10000, scale: 120, desc: "melee attacks deal poison damage", poisonDmg: 5, poisonTime: 6 },
          { id: 46, name: "Bull Mask", price: 10000, scale: 120, desc: "bulls won't target you unless you attack them", bullRepel: 1 },
          { id: 14, name: "Windmill Hat", topSprite: true, price: 10000, scale: 120, desc: "generates points while worn", pps: 1.5 },
          { id: 11, name: "Spike Gear", topSprite: true, price: 10000, scale: 120, desc: "deal damage to players that damage you", dmg: 0.45 },
          { id: 53, name: "Turret Gear", topSprite: true, price: 10000, scale: 120, desc: "you become a walking turret", turret: { proj: 1, range: 700, rate: 2500 }, spdMult: 0.7 },
          { id: 20, name: "Samurai Armor", price: 12000, scale: 120, desc: "increased attack speed and fire rate", atkSpd: 0.78 },
          { id: 58, name: "Dark Knight", price: 12000, scale: 120, desc: "restores health when you deal damage", healD: 0.4 },
          { id: 27, name: "Scavenger Gear", price: 15000, scale: 120, desc: "earn double points for each kill", kScrM: 2 },
          { id: 40, name: "Tank Gear", price: 15000, scale: 120, desc: "increased damage to buildings but slower movement", spdMult: 0.3, bDmg: 3.3 },
          { id: 52, name: "Thief Gear", price: 15000, scale: 120, desc: "steal half of a players gold when you kill them", goldSteal: 0.5 },
          { id: 55, name: "Bloodthirster", price: 20000, scale: 120, desc: "Restore Health when dealing damage. And increased damage", healD: 0.25, dmgMultO: 1.2 },
          { id: 56, name: "Assassin Gear", price: 20000, scale: 120, desc: "Go invisible when not moving. Can't eat. Increased speed", noEat: true, spdMult: 1.1, invisTimer: 1000 }
        ];

        const accessories = [
          { id: 12, name: "Snowball", price: 1000, scale: 105, xOff: 18, desc: "half the snow slowdown" },
          { id: 9, name: "Tree Cape", price: 1000, scale: 90, desc: "1 extra wood per hit on a tree" },
          { id: 10, name: "Stone Cape", price: 1000, scale: 90, desc: "1 extra stone per hit on a rock" },
          { id: 3, name: "Cookie Cape", price: 1500, scale: 90, desc: "1 extra food per hit on a bush or cactus" },
          { id: 8, name: "Cow Cape", price: 2000, scale: 90, desc: "1.5x gold and food from cows" },
          { id: 11, name: "Monkey Tail", price: 2000, scale: 97, xOff: 25, desc: "Super speed but reduced damage", spdMult: 1.35, dmgMultO: 0.2 },
          { id: 17, name: "Apple Basket", price: 3000, scale: 80, xOff: 12, desc: "slowly regenerates health over time", healthRegen: 1 },
          { id: 6, name: "Winter Cape", price: 3000, scale: 90, desc: "no snow slowdown" },
          { id: 4, name: "Skull Cape", price: 4000, scale: 90, desc: "3x gold for killing the kill leader" },
          { id: 5, name: "Dash Cape", price: 5000, scale: 90, desc: "5% faster" },
          { id: 2, name: "Dragon Cape", price: 6000, scale: 90, desc: "5% more damage for 5s after hitting a player" },
          { id: 1, name: "Super Cape", price: 8000, scale: 90, desc: "after a kill: 5% more damage and 15% faster for 10s" },
          { id: 7, name: "Troll Cape", price: 8000, scale: 90, desc: "2x gold for kills by your spikes" },
          { id: 14, name: "Thorns", price: 10000, scale: 115, xOff: 20, desc: "heals a little when you hit a player" },
          { id: 15, name: "Blockades", price: 10000, scale: 95, xOff: 15, desc: "25% less damage from projectiles" },
          { id: 20, name: "Devils Tail", price: 10000, scale: 95, xOff: 20, desc: "hits make players bleed for 2s" },
          { id: 16, name: "Sawblade", price: 12000, scale: 90, spin: true, xOff: 0, desc: "deal damage to players that damage you", dmg: 0.15 },
          { id: 13, name: "Angel Wings", price: 15000, scale: 138, xOff: 22, desc: "slowly regenerates health over time", healthRegen: 3 },
          { id: 19, name: "Shadow Wings", price: 15000, scale: 138, xOff: 22, desc: "increased movement speed", spdMult: 1.1 },
          { id: 18, name: "Blood Wings", price: 20000, scale: 178, xOff: 26, desc: "restores health when you deal damage", healD: 0.2 },
          { id: 21, name: "Corrupt X Wings", price: 20000, scale: 178, xOff: 26, desc: "deal damage to players that damage you", dmg: 0.25 }
        ];

        const animals = [
          { index: 0, id: 0, src: "cow_1", killScore: 150, health: 500, weightM: 0.8, speed: 0.00095, turnSpeed: 0.001, scale: 72, drop: ["food", 50] },
          { index: 1, id: 1, src: "pig_1", killScore: 200, health: 800, weightM: 0.6, speed: 0.00085, turnSpeed: 0.001, scale: 72, drop: ["food", 80] },
          { index: 2, id: 2, name: "Bull", src: "bull_2", hostile: true, dmg: 20, killScore: 1000, health: 1800, weightM: 0.5, speed: 0.00094, turnSpeed: 0.00074, scale: 78, viewRange: 800, chargePlayer: true, drop: ["food", 100] },
          { index: 3, id: 3, name: "Bully", src: "bull_1", hostile: true, dmg: 20, killScore: 2000, health: 2800, weightM: 0.45, speed: 0.001, turnSpeed: 0.0008, scale: 90, viewRange: 900, chargePlayer: true, drop: ["food", 400] },
          { index: 4, id: 4, name: "Wolf", src: "wolf_1", hostile: true, dmg: 8, killScore: 500, health: 300, weightM: 0.45, speed: 0.001, turnSpeed: 0.002, scale: 84, viewRange: 800, chargePlayer: true, drop: ["food", 200] },
          { index: 5, id: 5, name: "Quack", src: "chicken_1", dmg: 8, killScore: 2000, noTrap: true, health: 300, weightM: 0.2, speed: 0.0018, turnSpeed: 0.006, scale: 70, drop: ["food", 100] },
          { index: 6, id: 6, name: "MOOSTAFA", nameScale: 50, src: "enemy", hostile: true, dontRun: true, fixedSpawn: true, spawnDelay: 60000, noTrap: true, colDmg: 100, dmg: 40, killScore: 8000, health: 18000, weightM: 0.4, speed: 0.0007, turnSpeed: 0.01, scale: 80, spriteMlt: 1.8, leapForce: 0.9, viewRange: 1000, hitRange: 210, hitDelay: 1000, chargePlayer: true, drop: ["food", 100] },
          { index: 7, id: 7, name: "Treasure", hostile: true, nameScale: 35, src: "crate_1", fixedSpawn: true, spawnDelay: 120000, colDmg: 200, killScore: 5000, health: 20000, weightM: 0.1, speed: 0, turnSpeed: 0, scale: 70, spriteMlt: 1 },
          { index: 8, id: 8, name: "MOOFIE", src: "wolf_2", hostile: true, fixedSpawn: true, dontRun: true, hitScare: 4, spawnDelay: 30000, noTrap: true, nameScale: 35, dmg: 10, colDmg: 100, killScore: 3000, health: 7000, weightM: 0.45, speed: 0.0015, turnSpeed: 0.002, scale: 90, viewRange: 800, chargePlayer: true, drop: ["food", 1000] },
          { index: 9, id: 9, name: "Boar", src: "boar_1", hostile: true, dmg: 14, killScore: 800, health: 900, weightM: 0.55, speed: 0.00105, turnSpeed: 0.0012, scale: 76, viewRange: 700, chargePlayer: true, drop: ["food", 150] },
          { index: 10, id: 10, name: "Yeti", src: "yeti_1", hostile: true, dmg: 25, killScore: 4500, health: 3200, weightM: 0.35, speed: 0.0008, turnSpeed: 0.0008, scale: 95, viewRange: 750, leapForce: 0.6, chargePlayer: true, drop: ["food", 800] },
          { index: 11, id: 11, name: "Crab King", src: "crab_1", boss: true, hostile: true, dontRun: true, fixedSpawn: true, noTrap: true, dmg: 45, killScore: 4000, health: 480000, weightM: 0, speed: 0.00045, turnSpeed: 0.0007, scale: 280, viewRange: 1800, hitRange: 400, hitDelay: 700 },
          { index: 12, id: 12, src: "sheep_1", killScore: 200, health: 650, weightM: 0.7, speed: 0.0009, turnSpeed: 0.001, scale: 72, drop: ["food", 150] },
          { index: 13, id: 13, name: "Crab", src: "crab_1", diver: true, hostile: true, noTrap: true, dmg: 14.4, killScore: 400, health: 500, weightM: 0.5, speed: 0.0014, turnSpeed: 0.003, scale: 78, viewRange: 4000, chargePlayer: true },
          { index: 14, id: 14, name: "Crabling", src: "crab_1", diver: true, hostile: true, noTrap: true, dmg: 6, killScore: 200, health: 250, weightM: 0.5, speed: 0.0017, turnSpeed: 0.004, scale: 39, viewRange: 4000, chargePlayer: true }
        ];

        const byId = (arr) => { const m = new Map(); for (const x of arr) m.set(x.id, x); return m; };
        const byName = (arr) => { const m = new Map(); for (const x of arr) m.set(String(x.name).toLowerCase(), x); return m; };

        const weaponId = byId(weapons), weaponName = byName(weapons);
        const itemId = byId(items), itemName = byName(items);
        const hatId = byId(hats), hatName = byName(hats);
        const accId = byId(accessories), accName = byName(accessories);

        return {
          groups, projectiles, weapons, items, hats, accessories, animals,
          animal: (index) => animals[index],
          weapon: (id) => weaponId.get(id),
          weaponByName: (n) => weaponName.get(String(n).toLowerCase()),
          item: (id) => itemId.get(id),
          itemByName: (n) => itemName.get(String(n).toLowerCase()),
          hat: (id) => hatId.get(id),
          hatByName: (n) => hatName.get(String(n).toLowerCase()),
          accessory: (id) => accId.get(id),
          accessoryByName: (n) => accName.get(String(n).toLowerCase()),
          groupName: (gid) => (groups[gid] && groups[gid].name) || null
        };
      });

      /* ===== module: net/msgpack (loader/src/net/msgpack.js) ===== */
      (function (root, factory) {
        const value = factory();
        if (typeof module === "object" && module.exports) module.exports = value;
        if (typeof root !== "undefined") root.MooMooMsgpack = value;
        if (typeof globalThis !== "undefined") globalThis.MooMooMsgpack = value;
      })(typeof self !== "undefined" ? self : this, function () {
        "use strict";

        const textEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
        const textDecoder = typeof TextDecoder !== "undefined" ? new TextDecoder() : null;

        function utf8Encode(str) {
          if (textEncoder) return textEncoder.encode(str);
          const bytes = [];
          for (let i = 0; i < str.length; i++) {
            let c = str.charCodeAt(i);
            if (c < 0x80) bytes.push(c);
            else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
            else if (c >= 0xd800 && c <= 0xdbff) {
              const c2 = str.charCodeAt(++i);
              c = 0x10000 + ((c & 0x3ff) << 10) + (c2 & 0x3ff);
              bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
            } else bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
          }
          return new Uint8Array(bytes);
        }

        function utf8Decode(bytes) {
          if (textDecoder) return textDecoder.decode(bytes);
          let str = "";
          for (let i = 0; i < bytes.length;) {
            const b = bytes[i++];
            if (b < 0x80) str += String.fromCharCode(b);
            else if (b < 0xe0) str += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i++] & 0x3f));
            else if (b < 0xf0) str += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f));
            else {
              const cp = ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
              const off = cp - 0x10000;
              str += String.fromCharCode(0xd800 + (off >> 10), 0xdc00 + (off & 0x3ff));
            }
          }
          return str;
        }

        class Writer {
          constructor() {
            this.buf = new Uint8Array(128);
            this.len = 0;
          }
          ensure(n) {
            if (this.len + n <= this.buf.length) return;
            let cap = this.buf.length * 2;
            while (cap < this.len + n) cap *= 2;
            const next = new Uint8Array(cap);
            next.set(this.buf.subarray(0, this.len));
            this.buf = next;
          }
          u8(v) { this.ensure(1); this.buf[this.len++] = v & 0xff; }
          u16(v) { this.ensure(2); this.buf[this.len++] = (v >> 8) & 0xff; this.buf[this.len++] = v & 0xff; }
          u32(v) { this.ensure(4); this.buf[this.len++] = (v >>> 24) & 0xff; this.buf[this.len++] = (v >>> 16) & 0xff; this.buf[this.len++] = (v >>> 8) & 0xff; this.buf[this.len++] = v & 0xff; }
          bytes(arr) { this.ensure(arr.length); this.buf.set(arr, this.len); this.len += arr.length; }
          f64(v) {
            this.ensure(8);
            const dv = new DataView(this.buf.buffer, this.buf.byteOffset + this.len, 8);
            dv.setFloat64(0, v, false);
            this.len += 8;
          }
          result() { return this.buf.slice(0, this.len); }
        }

        function encodeInt(w, n) {
          if (n >= 0) {
            if (n < 0x80) { w.u8(n); return; }
            if (n < 0x100) { w.u8(0xcc); w.u8(n); return; }
            if (n < 0x10000) { w.u8(0xcd); w.u16(n); return; }
            if (n < 0x100000000) { w.u8(0xce); w.u32(n); return; }
            w.u8(0xcf);
            const hi = Math.floor(n / 0x100000000);
            w.u32(hi); w.u32(n >>> 0);
            return;
          }
          if (n >= -0x20) { w.u8(0xe0 | (n + 0x20)); return; }
          if (n >= -0x80) { w.u8(0xd0); w.u8(n & 0xff); return; }
          if (n >= -0x8000) { w.u8(0xd1); w.u16(n & 0xffff); return; }
          if (n >= -0x80000000) { w.u8(0xd2); w.u32(n >>> 0); return; }
          w.u8(0xd3);
          const hi = Math.floor(n / 0x100000000);
          w.u32(hi >>> 0); w.u32(n >>> 0);
        }

        function encodeValue(w, v) {
          if (v === null || v === undefined) { w.u8(0xc0); return; }
          const t = typeof v;
          if (t === "boolean") { w.u8(v ? 0xc3 : 0xc2); return; }
          if (t === "number") {
            if (Number.isInteger(v)) encodeInt(w, v);
            else { w.u8(0xcb); w.f64(v); }
            return;
          }
          if (t === "string") {
            const bytes = utf8Encode(v);
            const n = bytes.length;
            if (n < 0x20) w.u8(0xa0 | n);
            else if (n < 0x100) { w.u8(0xd9); w.u8(n); }
            else if (n < 0x10000) { w.u8(0xda); w.u16(n); }
            else { w.u8(0xdb); w.u32(n); }
            w.bytes(bytes);
            return;
          }
          if (v instanceof Uint8Array || (typeof ArrayBuffer !== "undefined" && v instanceof ArrayBuffer)) {
            const bytes = v instanceof ArrayBuffer ? new Uint8Array(v) : v;
            const n = bytes.length;
            if (n < 0x100) { w.u8(0xc4); w.u8(n); }
            else if (n < 0x10000) { w.u8(0xc5); w.u16(n); }
            else { w.u8(0xc6); w.u32(n); }
            w.bytes(bytes);
            return;
          }
          if (Array.isArray(v)) {
            const n = v.length;
            if (n < 0x10) w.u8(0x90 | n);
            else if (n < 0x10000) { w.u8(0xdc); w.u16(n); }
            else { w.u8(0xdd); w.u32(n); }
            for (let i = 0; i < n; i++) encodeValue(w, v[i]);
            return;
          }
          if (t === "object") {
            const keys = Object.keys(v);
            const n = keys.length;
            if (n < 0x10) w.u8(0x80 | n);
            else if (n < 0x10000) { w.u8(0xde); w.u16(n); }
            else { w.u8(0xdf); w.u32(n); }
            for (let i = 0; i < n; i++) { encodeValue(w, keys[i]); encodeValue(w, v[keys[i]]); }
            return;
          }
          throw new Error("msgpack: cannot encode value of type " + t);
        }

        function encode(value) {
          const w = new Writer();
          encodeValue(w, value);
          return w.result();
        }

        class Reader {
          constructor(bytes) {
            this.b = bytes;
            this.pos = 0;
            this.dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
          }
          u8() { return this.b[this.pos++]; }
          i8() { return (this.b[this.pos++] << 24) >> 24; }
          u16() { const v = this.dv.getUint16(this.pos, false); this.pos += 2; return v; }
          i16() { const v = this.dv.getInt16(this.pos, false); this.pos += 2; return v; }
          u32() { const v = this.dv.getUint32(this.pos, false); this.pos += 4; return v; }
          i32() { const v = this.dv.getInt32(this.pos, false); this.pos += 4; return v; }
          u64() { const hi = this.u32(), lo = this.u32(); return hi * 0x100000000 + lo; }
          i64() { const hi = this.i32(), lo = this.u32(); return hi * 0x100000000 + lo; }
          f32() { const v = this.dv.getFloat32(this.pos, false); this.pos += 4; return v; }
          f64() { const v = this.dv.getFloat64(this.pos, false); this.pos += 8; return v; }
          str(n) { const s = utf8Decode(this.b.subarray(this.pos, this.pos + n)); this.pos += n; return s; }
          bin(n) { const s = this.b.slice(this.pos, this.pos + n); this.pos += n; return s; }
        }

        function decodeValue(r) {
          const c = r.u8();
          if (c < 0x80) return c;
          if (c >= 0xe0) return c - 0x100;
          if (c >= 0x80 && c <= 0x8f) return readMap(r, c & 0x0f);
          if (c >= 0x90 && c <= 0x9f) return readArray(r, c & 0x0f);
          if (c >= 0xa0 && c <= 0xbf) return r.str(c & 0x1f);
          switch (c) {
            case 0xc0: return null;
            case 0xc2: return false;
            case 0xc3: return true;
            case 0xc4: return r.bin(r.u8());
            case 0xc5: return r.bin(r.u16());
            case 0xc6: return r.bin(r.u32());
            case 0xca: return r.f32();
            case 0xcb: return r.f64();
            case 0xcc: return r.u8();
            case 0xcd: return r.u16();
            case 0xce: return r.u32();
            case 0xcf: return r.u64();
            case 0xd0: return r.i8();
            case 0xd1: return r.i16();
            case 0xd2: return r.i32();
            case 0xd3: return r.i64();
            case 0xd9: return r.str(r.u8());
            case 0xda: return r.str(r.u16());
            case 0xdb: return r.str(r.u32());
            case 0xdc: return readArray(r, r.u16());
            case 0xdd: return readArray(r, r.u32());
            case 0xde: return readMap(r, r.u16());
            case 0xdf: return readMap(r, r.u32());
            default: throw new Error("msgpack: unsupported format 0x" + c.toString(16));
          }
        }

        function readArray(r, n) {
          const out = new Array(n);
          for (let i = 0; i < n; i++) out[i] = decodeValue(r);
          return out;
        }

        function readMap(r, n) {
          const out = {};
          for (let i = 0; i < n; i++) {
            const k = String(decodeValue(r));
            const val = decodeValue(r);
            if (k !== "__proto__" && k !== "constructor" && k !== "prototype") out[k] = val;
          }
          return out;
        }

        function decode(bytes) {
          return decodeValue(new Reader(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)));
        }

        return { encode, decode };
      });

      /* ===== module: net/sha256 (loader/src/net/sha256.js) ===== */
      (function (root, factory) {
        const value = factory();
        if (typeof module === "object" && module.exports) module.exports = value;
        if (typeof root !== "undefined") root.MooMooSha256 = value;
        if (typeof globalThis !== "undefined") globalThis.MooMooSha256 = value;
      })(typeof self !== "undefined" ? self : this, function () {
        "use strict";

        const K = new Uint32Array([
          0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
          0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
          0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
          0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
          0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
          0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
          0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
          0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
        ]);

        function sha256(msg) {
          const h = new Uint32Array([
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
          ]);

          const len = msg.length;
          const bitLen = len * 8;
          const total = ((len + 8) >> 6 << 6) + 64;
          const data = new Uint8Array(total);
          data.set(msg);
          data[len] = 0x80;
          const dv = new DataView(data.buffer);
          dv.setUint32(total - 4, bitLen >>> 0, false);
          dv.setUint32(total - 8, Math.floor(bitLen / 0x100000000) >>> 0, false);

          const w = new Uint32Array(64);
          for (let off = 0; off < total; off += 64) {
            for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
            for (let i = 16; i < 64; i++) {
              const a = w[i - 15], b = w[i - 2];
              const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
              const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
              w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
            }
            let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
            for (let i = 0; i < 64; i++) {
              const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
              const ch = (e & f) ^ (~e & g);
              const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
              const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
              const maj = (a & b) ^ (a & c) ^ (b & c);
              const t2 = (S0 + maj) >>> 0;
              hh = g; g = f; f = e;
              e = (d + t1) >>> 0;
              d = c; c = b; b = a;
              a = (t1 + t2) >>> 0;
            }
            h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
            h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
          }

          const out = new Uint8Array(32);
          const odv = new DataView(out.buffer);
          for (let i = 0; i < 8; i++) odv.setUint32(i * 4, h[i], false);
          return out;
        }

        const BLOCK = 64;

        function hmacSha256(key, data) {
          let k = key instanceof Uint8Array ? key : new Uint8Array(key);
          if (k.length > BLOCK) k = sha256(k);
          const ipad = new Uint8Array(BLOCK + data.length);
          const opadKey = new Uint8Array(BLOCK);
          for (let i = 0; i < BLOCK; i++) {
            const kb = i < k.length ? k[i] : 0;
            ipad[i] = kb ^ 0x36;
            opadKey[i] = kb ^ 0x5c;
          }
          ipad.set(data, BLOCK);
          const inner = sha256(ipad);
          const opad = new Uint8Array(BLOCK + 32);
          opad.set(opadKey);
          opad.set(inner, BLOCK);
          return sha256(opad);
        }

        return { sha256, hmacSha256 };
      });

      /* ===== module: net/protocol (loader/src/net/protocol.js) ===== */
      (function (root, factory) {
        const deps = (typeof require === "function")
          ? { sha256: require("./sha256.js"), msgpack: require("./msgpack.js") }
          : { sha256: root.MooMooSha256, msgpack: root.MooMooMsgpack };
        const value = factory(deps);
        if (typeof module === "object" && module.exports) module.exports = value;
        if (typeof root !== "undefined") root.MooMooProtocol = value;
        if (typeof globalThis !== "undefined") globalThis.MooMooProtocol = value;
      })(typeof self !== "undefined" ? self : this, function (deps) {
        "use strict";

        const { sha256, hmacSha256 } = deps.sha256;
        const msgpack = deps.msgpack;

        const MODE_KEYED = 1;
        const MAC_LENGTH = 6;
        const LEGACY_SALT = 1;
        const LEGACY_C2S_COUNT = 17;
        const LEGACY_S2C_COUNT = 36;
        const BASE_C2S_COUNT = 22;
        const BASE_S2C_COUNT = 39;
        const TABLE_SIZE = 128;
        const C2S_PACKETS = ["M", "D", "9", "e", "F", "z", "H", "K", "L", "N", "b", "P", "Q", "c", "6", "S", "0", "T", "R", "A", "V", "I"];
        const S2C_PACKETS = ["A", "B", "C", "D", "E", "a", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "X", "Y", "Z", "g", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "W", "F", "p", "q", "r", "m"];
        const FNV_OFFSET = 2166136261;
        const FNV_PRIME = 16777619;
        const FNV_FINAL_MULT = 739982445;
        const TABLE_SALT_MULT = 2654435761;
        const TABLE_S2C_XOR = 2246822507;
        const MASK_C2S_XOR = 3266489909;
        const MASK_S2C_XOR = 668265263;
        const MASK_COUNTER_MULT = 2654435761;
        const MASK_ZERO_SEED = 1831565813;
        const SEAL_OFF = 0, SEAL_REPORT = 1, SEAL_BIND = 2;

        function mulberry32(seed) {
          return function () {
            seed |= 0;
            seed = (seed + 1831565813) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
          };
        }

        function fnvStep(hash, byte) { return Math.imul(hash ^ byte, FNV_PRIME); }
        function fnvFinish(hash) {
          hash ^= hash >>> 15;
          hash = Math.imul(hash, FNV_FINAL_MULT);
          hash ^= hash >>> 12;
          return hash >>> 0;
        }

        function saltedHash(text, salt) {
          let h = (FNV_OFFSET ^ salt) >>> 0;
          for (let i = 0; i < text.length; i++) h = fnvStep(h, text.charCodeAt(i) & 255);
          return fnvFinish(h);
        }

        function bytesHash(bytes, seed) {
          let h = (FNV_OFFSET ^ seed) >>> 0;
          for (let i = 0; i < bytes.length; i++) h = fnvStep(h, bytes[i]);
          return fnvFinish(h);
        }

        function fnvLedger(hash, bytes) {
          let h = hash >>> 0;
          for (let i = 0; i < bytes.length; i++) h = Math.imul(h ^ bytes[i], FNV_PRIME);
          return h >>> 0;
        }

        function sealValue(sealBytes, bundleDigest) {
          const n = Math.min(sealBytes.length, bundleDigest.length);
          const out = new Uint8Array(n);
          for (let i = 0; i < n; i++) out[i] = sealBytes[i] ^ bundleDigest[i];
          return out;
        }

        function shuffleTable(names, seed) {
          const count = names.length;
          const ids = names.map((_, i) => i);
          const rand = mulberry32(seed >>> 0);
          for (let i = count - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            const tmp = ids[i]; ids[i] = ids[j]; ids[j] = tmp;
          }
          const enc = {}, dec = {};
          for (let i = 0; i < count; i++) { enc[names[i]] = ids[i]; dec[ids[i]] = names[i]; }
          return { enc, dec };
        }

        function extendTable(table, names, base, salt) {
          const span = TABLE_SIZE - base;
          const taken = new Uint8Array(span);
          for (let i = base; i < names.length; i++) {
            let slot = saltedHash(names[i], salt) % span;
            while (taken[slot]) slot = (slot + 1) % span;
            taken[slot] = 1;
            table.enc[names[i]] = base + slot;
            table.dec[base + slot] = names[i];
          }
          return table;
        }

        function buildTables(seed, salt) {
          const legacy = salt == null;
          const tableSeed = (seed ^ Math.imul(legacy ? LEGACY_SALT : salt, TABLE_SALT_MULT)) >>> 0;
          if (legacy) {
            return {
              c2s: shuffleTable(C2S_PACKETS.slice(0, LEGACY_C2S_COUNT), tableSeed),
              s2c: shuffleTable(S2C_PACKETS.slice(0, LEGACY_S2C_COUNT), (tableSeed ^ TABLE_S2C_XOR) >>> 0)
            };
          }
          const s2cSeed = (tableSeed ^ TABLE_S2C_XOR) >>> 0;
          return {
            c2s: extendTable(shuffleTable(C2S_PACKETS.slice(0, BASE_C2S_COUNT), tableSeed), C2S_PACKETS, BASE_C2S_COUNT, tableSeed),
            s2c: extendTable(shuffleTable(S2C_PACKETS.slice(0, BASE_S2C_COUNT), s2cSeed), S2C_PACKETS, BASE_S2C_COUNT, s2cSeed)
          };
        }

        function hmacTag(key, data) {
          return hmacSha256(key, data).subarray(0, MAC_LENGTH);
        }

        function readU32LE(bytes, offset) {
          return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
        }

        function xorMask(bytes, seed) {
          let s = seed >>> 0;
          if (s === 0) s = MASK_ZERO_SEED;
          for (let i = 0; i < bytes.length; i += 4) {
            s ^= s << 13; s >>>= 0;
            s ^= s >>> 17;
            s ^= s << 5; s >>>= 0;
            bytes[i] ^= s & 255;
            if (i + 1 < bytes.length) bytes[i + 1] ^= (s >>> 8) & 255;
            if (i + 2 < bytes.length) bytes[i + 2] ^= (s >>> 16) & 255;
            if (i + 3 < bytes.length) bytes[i + 3] ^= (s >>> 24) & 255;
          }
          return bytes;
        }

        function deriveMaskSeeds(key) {
          return {
            c2s: (readU32LE(key, 0) ^ MASK_C2S_XOR) >>> 0,
            s2c: (readU32LE(key, 4) ^ MASK_S2C_XOR) >>> 0
          };
        }

        const s2cMaskSeed = (base, counter) => (base ^ Math.imul(counter, MASK_COUNTER_MULT)) >>> 0;
        const c2sMaskSeed = (base, tag) => (base ^ readU32LE(tag, 0)) >>> 0;

        function hexToBytes(hex) {
          const out = new Uint8Array(hex.length / 2);
          for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
          return out;
        }

        function isHandshake(frame) {
          try {
            const msg = msgpack.decode(frame);
            return Array.isArray(msg) && msg[0] === "io-init" ? msg : null;
          } catch {
            return null;
          }
        }

        class ClientSession {
          constructor(payload, mod, opts) {
            const [socketId, seed, keyHex, mode, pinned, sealMode] = payload;
            this.socketId = socketId;
            this.seed = seed >>> 0;
            this.mode = mode;
            this.pinned = Boolean(pinned);
            this.keyed = mode === MODE_KEYED;
            this.sealMode = sealMode | 0;
            this.sealReport = null;

            const seal = opts && opts.seal;
            const rawKey = hexToBytes(keyHex);
            if (this.pinned) {
              if (!mod || typeof mod.mixKey !== "function") throw new Error("pinned connection needs the moomoo-protocol module (mixKey)");
              let key = Uint8Array.from(mod.mixKey(rawKey, this.seed));
              if (seal && this.sealMode === SEAL_BIND) {
                for (let i = 0; i < seal.length && i < key.length; i++) key[i] ^= seal[i];
              }
              if (seal && this.sealMode !== SEAL_OFF) this.sealReport = bytesHash(seal, this.seed);
              this.key = key;
              this.tables = buildTables(this.seed, mod.BUILD_SALT);
              this.maskSeeds = deriveMaskSeeds(this.key);
            } else {
              this.key = rawKey;
              this.tables = buildTables(this.seed, null);
              this.maskSeeds = null;
            }

            this.received = 0;
            this.lastSeq = 0;
            this.ledger = this.pinned ? FNV_OFFSET : 0;
            this.ledgerBefore = this.ledger;
          }

          decodeS2C(frame) {
            const bytes = new Uint8Array(frame.length);
            bytes.set(frame);
            if (this.maskSeeds) xorMask(bytes, s2cMaskSeed(this.maskSeeds.s2c, ++this.received));
            const msg = msgpack.decode(bytes);
            if (!Array.isArray(msg)) throw new Error("s2c frame is not an array");
            const name = typeof msg[0] === "number" ? this.tables.s2c.dec[msg[0]] : msg[0];
            return { id: msg[0], name, args: Array.isArray(msg[1]) ? msg[1] : [] };
          }

          encodeC2S(name, args, seq) {
            const id = this.tables.c2s.enc[name];
            if (id === undefined) throw new Error('packet "' + name + '" is not in the c2s table');
            if (seq === undefined) seq = ++this.lastSeq; else this.lastSeq = seq;
            const body = msgpack.encode([id, args, seq]);
            if (this.pinned) { this.ledgerBefore = this.ledger; this.ledger = fnvLedger(this.ledger, body); }
            const tag = hmacTag(this.key, body);
            const masked = new Uint8Array(body.length);
            masked.set(body);
            if (this.maskSeeds) xorMask(masked, c2sMaskSeed(this.maskSeeds.c2s, tag));
            const out = new Uint8Array(MAC_LENGTH + masked.length);
            out.set(tag, 0);
            out.set(masked, MAC_LENGTH);
            return out;
          }

          decodeC2S(frame) {
            const bytes = new Uint8Array(frame.length);
            bytes.set(frame);
            if (bytes.length <= MAC_LENGTH) throw new Error("short c2s frame");
            const tag = bytes.subarray(0, MAC_LENGTH);
            const body = bytes.subarray(MAC_LENGTH);
            if (this.maskSeeds) xorMask(body, c2sMaskSeed(this.maskSeeds.c2s, tag));
            const msg = msgpack.decode(body);
            if (!Array.isArray(msg) || msg.length !== 3) throw new Error("malformed c2s body");
            const name = typeof msg[0] === "number" ? this.tables.c2s.dec[msg[0]] : msg[0];
            return { id: msg[0], name, args: Array.isArray(msg[1]) ? msg[1] : [], seq: msg[2] };
          }
        }

        return {
          MODE_KEYED, MAC_LENGTH,
          C2S_PACKETS, S2C_PACKETS, BASE_C2S_COUNT, BASE_S2C_COUNT, TABLE_SIZE,
          SEAL_OFF, SEAL_REPORT, SEAL_BIND,
          mulberry32, shuffleTable, extendTable, buildTables,
          fnvStep, fnvFinish, saltedHash, bytesHash, fnvLedger, sealValue, sha256,
          hmacTag, xorMask, deriveMaskSeeds, s2cMaskSeed, c2sMaskSeed,
          readU32LE, hexToBytes, isHandshake,
          ClientSession
        };
      });

      /* ===== module: net/binding (loader/src/net/binding.js) ===== */
      (function (root, factory) {
        const value = factory();
        if (typeof module === "object" && module.exports) module.exports = value;
        if (typeof root !== "undefined") root.MooMooBinding = value;
        if (typeof globalThis !== "undefined") globalThis.MooMooBinding = value;
      })(typeof self !== "undefined" ? self : this, function () {
        "use strict";

        const bool = (v) => (v ? 1 : 0);
        const passthrough = (event) => ({ event, parse: (args) => ({ args }) });

        function parsePlayersUpdate(args) {
          const positions = [];
          const pos = args[0] || [];
          for (let i = 0; i + 3 < pos.length; i += 4) {
            positions.push({ sid: pos[i], x: pos[i + 1], y: pos[i + 2], dir: pos[i + 3] / 100 });
          }
          const attributes = [];
          const at = args[1] || [];
          for (let i = 0; i + 9 < at.length; i += 10) {
            attributes.push({
              sid: at[i], buildIndex: at[i + 1], weaponIndex: at[i + 2], variant: at[i + 3],
              team: at[i + 4], isLeader: !!at[i + 5], skin: at[i + 6], tail: at[i + 7],
              icon: at[i + 8], zIndex: at[i + 9]
            });
          }
          return { positions, attributes, hidden: args[2] || [] };
        }

        const incoming = {
          A: passthrough("init"),
          B: { event: "disconnect", parse: (a) => ({ reason: a[0] }) },
          C: { event: "setup", parse: (a) => ({ sid: a[0] }) },
          D: { event: "playerAdd", parse: (a) => ({ data: a[0], isYou: !!a[1] }) },
          E: { event: "playerRemove", parse: (a) => ({ sid: a[0] }) },
          a: { event: "playersUpdate", parse: parsePlayersUpdate },
          G: passthrough("leaderboard"),
          H: passthrough("objectsLoad"),
          I: passthrough("animalsUpdate"),
          J: passthrough("animalAttack"),
          K: passthrough("gatherAnimation"),
          L: passthrough("wiggle"),
          M: passthrough("turretShoot"),
          N: { event: "playerValue", parse: (a) => ({ key: a[0], value: a[1], updateView: !!a[2] }) },
          O: { event: "health", parse: (a) => ({ sid: a[0], value: a[1] }) },
          P: { event: "died", parse: () => ({}) },
          Q: passthrough("objectKilled"),
          R: passthrough("objectsKilled"),
          S: passthrough("itemCount"),
          T: passthrough("age"),
          U: { event: "upgrades", parse: (a) => ({ points: a[0], age: a[1] }) },
          V: { event: "inventory", parse: (a) => ({ list: a[0], isWeapon: !!a[1] }) },
          X: passthrough("projectileAdd"),
          Y: passthrough("projectileRemove"),
          Z: passthrough("shutdownNotice"),
          g: passthrough("tribeAdd"),
          1: passthrough("tribeDelete"),
          2: passthrough("tribeJoinRequest"),
          3: passthrough("tribeSet"),
          4: passthrough("tribeMembers"),
          5: passthrough("storeUpdate"),
          6: { event: "chat", parse: (a) => ({ sid: a[0], message: a[1] }) },
          7: passthrough("minimap"),
          8: { event: "showText", parse: (a) => ({ x: a[0], y: a[1], value: a[2], type: a[3] }) },
          9: { event: "mapPing", parse: (a) => ({ x: a[0], y: a[1] }) },
          0: { event: "pong", parse: () => ({}) },
          W: passthrough("effect"),
          F: passthrough("stats"),
          p: passthrough("profile"),
          q: { event: "probes", parse: (a) => ({ salt: a[0], probes: a[1] || [] }) },
          r: passthrough("updateCountdown"),
          m: { event: "dive", parse: (a) => ({ sid: a[0], state: a[1] }) }
        };

        const outgoing = {
          spawn: {
            wire: "M",
            build: (d) => {
              const o = { name: d.name == null ? "" : String(d.name), moofoll: d.moofoll ? 1 : 0, skin: d.skin | 0 };
              if (d.anon) o.anon = 1;
              return [o];
            }
          },
          aim: { wire: "D", build: (d) => [d.dir] },
          move: { wire: "9", build: (d) => [d.dir === undefined ? null : d.dir] },
          stopMove: { wire: "e", build: () => [] },
          mouse: { wire: "F", build: (d) => [bool(d.down), d.dir === undefined ? null : d.dir] },
          selectItem: { wire: "z", build: (d) => [d.index, bool(d.isWeapon)] },
          upgrade: { wire: "H", build: (d) => [d.index] },
          toggle: { wire: "K", build: (d) => [d.which] },
          createTribe: { wire: "L", build: (d) => [d.name] },
          leaveTribe: { wire: "N", build: () => [] },
          joinTribe: { wire: "b", build: (d) => [d.name] },
          answerJoin: { wire: "P", build: (d) => [d.sid, bool(d.accept)] },
          kickMember: { wire: "Q", build: (d) => [d.sid] },
          store: { wire: "c", build: (d) => [d.action ? 0 : 1, d.id, bool(d.isAccessory)] },
          chat: {
            wire: "6",
            build: (d) => {
              try {
                if (window.game && typeof window.game.sendChat === "function") {
                  window.game.sendChat(d.message);
                  return [];
                }
              } catch (e) {}
              return [d.message == null ? "" : String(d.message)];
            }
          },
          pingMap: { wire: "S", build: () => [] },
          ping: { wire: "0", build: () => [] },
          watchStats: { wire: "V", build: (d) => [d.sid] },
          report: { wire: "R", build: (d) => d.args || [] },
          admin: { wire: "A", build: (d) => d.args || [] },
          anon: { wire: "I", build: (d) => [d.on ? 1 : 0] }
        };

        const outgoingParse = {
          M: { action: "spawn", parse: (a) => Object.assign({}, a[0] || {}) },
          D: { action: "aim", parse: (a) => ({ dir: a[0] }) },
          9: { action: "move", parse: (a) => ({ dir: a[0] == null ? null : a[0] }) },
          e: { action: "stopMove", parse: () => ({}) },
          F: { action: "mouse", parse: (a) => ({ down: !!a[0], dir: a.length > 1 ? a[1] : undefined }) },
          z: { action: "selectItem", parse: (a) => ({ index: a[0], isWeapon: !!a[1] }) },
          H: { action: "upgrade", parse: (a) => ({ index: a[0] }) },
          K: { action: "toggle", parse: (a) => ({ which: a[0] }) },
          L: { action: "createTribe", parse: (a) => ({ name: a[0] }) },
          N: { action: "leaveTribe", parse: () => ({}) },
          b: { action: "joinTribe", parse: (a) => ({ name: a[0] }) },
          P: { action: "answerJoin", parse: (a) => ({ sid: a[0], accept: !!a[1] }) },
          Q: { action: "kickMember", parse: (a) => ({ sid: a[0] }) },
          c: { action: "store", parse: (a) => ({ action: a[0] ? 0 : 1, id: a[1], isAccessory: !!a[2] }) },
          6: { action: "chat", parse: (a) => ({ message: a[0] }) },
          S: { action: "pingMap", parse: () => ({}) },
          0: { action: "ping", parse: () => ({}) },
          V: { action: "watchStats", parse: (a) => ({ sid: a[0] }) },
          R: { action: "report", parse: (a) => ({ args: a.slice() }) },
          A: { action: "admin", parse: (a) => ({ args: a.slice() }) },
          I: { action: "anon", parse: (a) => ({ on: !!a[0] }) }
        };

        const rateLimits = {
          global: [150, 300],
          packets: {
            M: [1, 3], D: [60, 120], 9: [40, 80], e: [10, 20], F: [40, 80], z: [20, 40], H: [10, 20],
            K: [10, 20], L: [2, 4], N: [2, 4], b: [2, 4], P: [5, 10], Q: [5, 10], c: [10, 20],
            6: [2, 4], S: [1, 2], 0: [2, 4], T: [1, 3], R: [2, 5], A: [20, 40], V: [4, 8], I: [1, 2]
          }
        };

        const TELEMETRY_FIELDS = 7;
        const IO_INIT_FIELDS = 6;
        const FLAG_NAMES = {
          1: "USERSCRIPT_MANAGER", 2: "SOCKET_HOOKED", 4: "RENDER_HOOKED",
          8: "DEBUGGER_PAUSED", 16: "SOCKET_INTEGRITY", 32: "SOCKET_TAMPERED"
        };

        function telemetryInspect(args) {
          const flags = args && args.length > 0 ? (args[0] | 0) : 0;
          const names = [];
          for (const bit in FLAG_NAMES) if (flags & Number(bit)) names.push(FLAG_NAMES[bit]);
          return {
            flags, flagNames: names,
            untrusted: args && args.length > 1 ? (args[1] | 0) : 0,
            probeResult: args && args.length > 2 ? (args[2] | 0) : 0
          };
        }

        function telemetryGlobal() {
          const cands = [];
          try { if (typeof window !== "undefined" && window) cands.push(window); } catch (e) {}
          try { if (typeof self !== "undefined" && self) cands.push(self); } catch (e) {}
          try { if (typeof globalThis !== "undefined" && globalThis) cands.push(globalThis); } catch (e) {}
          for (let i = 0; i < cands.length; i++) {
            const c = cands[i];
            try { if (c.document || c.localStorage) return c; } catch (e) {}
          }
          return cands[0] || {};
        }

        function telemetryResolve(path) {
          try {
            const root = telemetryGlobal();
            return String(path).split(".").reduce((o, k) => (o == null ? o : o[k]), root);
          } catch (e) { return undefined; }
        }

        function telemetryNativeFn(fn) {
          try { return typeof fn === "function" && /\{\s*\[native code\]\s*\}/.test(Function.prototype.toString.call(fn)); }
          catch (e) { return false; }
        }

        function telemetrySaltedHash(text, salt) {
          let h = (2166136261 ^ salt) >>> 0;
          for (let i = 0; i < text.length; i++) h = Math.imul(h ^ (text.charCodeAt(i) & 255), 16777619);
          h ^= h >>> 15; h = Math.imul(h, 739982445); h ^= h >>> 12; return h >>> 0;
        }

        const LOADER_LS_KEY = /^(?:moomoojs:|mml[_:]|mmp[_:]|moomoo\.js)/i;
        const LOADER_CONTAINER_SEL = "[class*='mml-'],[class*='mmj-'],[class*='mdbg'],[class*='moomoo']";

        function loaderOwnedElement(el) {
          try {
            const cn = el.className, cls = (cn && cn.baseVal != null ? cn.baseVal : cn) || "";
            if (/\bmml-|\bmmj-|\bmdbg\b|moomoojs/i.test(String(cls)) || /mml|mmj|mdbg|moomoojs/i.test(el.id || "")) return true;
            if (typeof el.closest === "function" && el.closest(LOADER_CONTAINER_SEL)) return true;
            return false;
          } catch (e) { return false; }
        }

        function hashHitsLoaderKey(hashVal, saltVal) {
          const ls = telemetryGlobal().localStorage; if (!ls) return false;
          const keys = Object.keys(ls);
          for (let j = 0; j < keys.length; j++) if (LOADER_LS_KEY.test(keys[j]) && telemetrySaltedHash(keys[j], saltVal) === hashVal) return true;
          return false;
        }

        function hashHitsLoaderId(hashVal, saltVal) {
          const doc = telemetryGlobal().document; if (!doc || !doc.querySelectorAll) return false;
          const list = doc.querySelectorAll("[id]");
          for (let j = 0; j < list.length; j++) {
            const el = list[j];
            if (loaderOwnedElement(el) && telemetrySaltedHash(el.tagName.toLowerCase() + "#" + el.id, saltVal) === hashVal) return true;
          }
          return false;
        }

        function hashHitsLoaderClass(hashVal, saltVal) {
          const doc = telemetryGlobal().document; if (!doc || !doc.querySelectorAll) return false;
          const list = doc.querySelectorAll(LOADER_CONTAINER_SEL + ",[class*='mml-'] *,[class*='mmj-'] *,[class*='mdbg'] *,[class*='moomoo'] *");
          for (let j = 0; j < list.length; j++) {
            const el = list[j]; if (!loaderOwnedElement(el)) continue;
            const tag = (el.tagName || "").toLowerCase();
            const cn = el.className, raw = String((cn && cn.baseVal != null ? cn.baseVal : cn) || "");
            const toks = raw.split(/\s+/).filter(Boolean);
            for (let k = 0; k < toks.length; k++) if (telemetrySaltedHash(tag + "." + toks[k], saltVal) === hashVal) return true;
            if (raw && telemetrySaltedHash(tag + "." + raw, saltVal) === hashVal) return true;
            if (toks.length > 1 && telemetrySaltedHash(tag + "." + toks.join("."), saltVal) === hashVal) return true;
          }
          return false;
        }

        function loaderArtifactProbe(kind, path, hash, salt) {
          try {
            if (kind === 7) { const fn = telemetryResolve(path); return typeof fn === "function" && !telemetryNativeFn(fn); }
            if (kind === 5) { const o = telemetryResolve(path); return !!(o && o.prototype && o.prototype.constructor !== o); }
            if (kind === 3) return hashHitsLoaderKey(hash, salt);
            if (kind === 4) return hashHitsLoaderId(hash, salt);
            if (kind === 8) return hashHitsLoaderClass(hash, salt);
            if (kind === 9) return /moomoo/i.test(String(path));
          } catch (e) {}
          return false;
        }

        function cleanProbeResult(clientResult, probes, salt) {
          let result = clientResult | 0;
          if (!Array.isArray(probes)) return result >>> 0;
          salt = salt >>> 0;
          for (let i = 0; i < probes.length && i < 32; i++) {
            if (!(result & (1 << i))) continue;
            const p = probes[i]; if (!p) continue;
            if (loaderArtifactProbe(p[0], p[1] || "", p[2] >>> 0, salt)) result &= ~(1 << i);
          }
          return result >>> 0;
        }

        const KNOWN_PROBE_KINDS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

        function telemetryGlobalHealthy() {
          try {
            let realDoc = false;
            try { if (typeof document !== "undefined" && document) realDoc = true; } catch (e) {}
            try { if (!realDoc && typeof window !== "undefined" && window && window.document) realDoc = true; } catch (e) {}
            if (!realDoc) return true;
            const g = telemetryGlobal();
            return !!(g && (g.document || g.localStorage));
          } catch (e) { return true; }
        }

        function auditProbeResult(clientResult, cleaned, probes, salt) {
          const warnings = [];
          if (!telemetryGlobalHealthy()) warnings.push({ type: "dom-blind", detail: "telemetryGlobal() cannot see the page document/localStorage" });
          if (Array.isArray(probes)) {
            salt = salt >>> 0;
            const client = clientResult | 0, clean = cleaned | 0;
            for (let i = 0; i < probes.length && i < 32; i++) {
              const p = probes[i]; if (!p) continue;
              const kind = p[0], bit = 1 << i;
              if (KNOWN_PROBE_KINDS.indexOf(kind) < 0) {
                warnings.push({ type: "unknown-kind", kind, index: i, path: String(p[1] || ""), matched: !!(client & bit) });
                continue;
              }
              if ((clean & bit) && loaderArtifactProbe(kind, p[1] || "", p[2] >>> 0, salt)) {
                warnings.push({ type: "residual-footprint", kind, index: i });
              }
            }
          }
          return warnings;
        }

        function telemetryConstruct(ctx, det) {
          det = det || {};
          const seal = ctx && ctx.sealReport != null ? ctx.sealReport : 0;
          const salt = ctx && ctx.probeSalt != null ? ctx.probeSalt : 0;
          const out = [det.flags | 0, det.untrusted | 0, det.probeResult | 0, seal, salt];
          if (ctx && ctx.seq != null && ctx.ledger != null) out.push(ctx.seq, ctx.ledger >>> 0);
          return out;
        }

        function outgoingKeys(map) {
          const wires = [];
          for (const k in map) if (map[k] && map[k].wire) wires.push(map[k].wire);
          return wires;
        }

        return {
          version: 2,
          incoming,
          outgoing,
          outgoingParse,
          rateLimits,
          contract: {
            ioInitFields: IO_INIT_FIELDS,
            telemetryFields: TELEMETRY_FIELDS,
            c2s: outgoingKeys(outgoing),
            s2c: Object.keys(incoming)
          },
          telemetry: {
            wire: "T",
            inspect: telemetryInspect,
            construct: telemetryConstruct,
            cleanProbeResult,
            auditProbeResult,
            telemetryGlobalHealthy,
            knownProbeKinds: KNOWN_PROBE_KINDS.slice(),
            scrub: (args, ctx) => telemetryConstruct(ctx)
          }
        };
      });

      /* ===== module: net/socket (loader/src/net/socket.js) ===== */
      (function (root, factory) {
        const value = factory();
        if (typeof module === "object" && module.exports) module.exports = value;
        if (typeof root !== "undefined") root.MooMooSocket = value;
        if (typeof globalThis !== "undefined") globalThis.MooMooSocket = value;
      })(typeof self !== "undefined" ? self : this, function () {
        "use strict";

        function installWebSocketProxy(win, onSocket, onError) {
          const NativeWebSocket = win.WebSocket;
          if (!NativeWebSocket) throw new Error("no WebSocket to hook");
          const report = (e) => { try { onError && onError(e); } catch (_) {} };

          const transforms = new WeakMap();
          const NativeProtoSend = NativeWebSocket.prototype && NativeWebSocket.prototype.send;

          if (NativeProtoSend) {
            const sendProxy = new Proxy(NativeProtoSend, {
              apply(target, ws, args) {
                const transform = ws && transforms.get(ws);
                if (!transform) return Reflect.apply(target, ws, args);
                try {
                  const out = transform(args[0], (d) => Reflect.apply(target, ws, [d]));
                  if (out !== undefined) Reflect.apply(target, ws, [out]);
                  return undefined;
                } catch (e) {
                  report(e);
                  return Reflect.apply(target, ws, args);
                }
              }
            });
            const orig = Object.getOwnPropertyDescriptor(NativeWebSocket.prototype, "send") || {};
            try {
              Object.defineProperty(NativeWebSocket.prototype, "send", {
                value: sendProxy,
                writable: "writable" in orig ? orig.writable : true,
                enumerable: "enumerable" in orig ? orig.enumerable : false,
                configurable: "configurable" in orig ? orig.configurable : true
              });
            } catch (e) {
              try { NativeWebSocket.prototype.send = sendProxy; } catch (_) { report(e); }
            }
          }

          const handler = {
            construct(target, args, newTarget) {
              const ws = Reflect.construct(target, args, newTarget === Proxied ? target : newTarget);
              try { onSocket && onSocket(ws, args && args[0]); } catch (e) { report(e); }
              return ws;
            },
            get(target, prop) { return Reflect.get(target, prop, target); },
            set(target, prop, value) { return Reflect.set(target, prop, value); },
            has(target, prop) { return Reflect.has(target, prop); },
            deleteProperty(target, prop) { return Reflect.deleteProperty(target, prop); },
            defineProperty(target, prop, desc) { return Reflect.defineProperty(target, prop, desc); },
            getOwnPropertyDescriptor(target, prop) { return Reflect.getOwnPropertyDescriptor(target, prop); },
            ownKeys(target) { return Reflect.ownKeys(target); },
            getPrototypeOf(target) { return Reflect.getPrototypeOf(target); },
            setPrototypeOf(target, proto) { return Reflect.setPrototypeOf(target, proto); },
            apply(target, thisArg, args) { return Reflect.apply(target, thisArg, args); }
          };

          const Proxied = new Proxy(NativeWebSocket, handler);

          try {
            const cd = Object.getOwnPropertyDescriptor(NativeWebSocket.prototype, "constructor") || {};
            Object.defineProperty(NativeWebSocket.prototype, "constructor", {
              value: Proxied,
              writable: "writable" in cd ? cd.writable : true,
              enumerable: "enumerable" in cd ? cd.enumerable : false,
              configurable: "configurable" in cd ? cd.configurable : true
            });
          } catch (e) { report(e); }

          let swapped = false;
          try {
            Object.defineProperty(win, "WebSocket", {
              value: Proxied, writable: true, enumerable: false, configurable: true
            });
            swapped = win.WebSocket === Proxied;
          } catch (e1) {
            try { win.WebSocket = Proxied; swapped = win.WebSocket === Proxied; } catch (e2) {}
          }
          if (!swapped) {
            report(new Error("could not replace window.WebSocket in this realm"));
          }

          return {
            native: NativeWebSocket,
            setTransform: (ws, fn) => { try { transforms.set(ws, fn); } catch (e) { report(e); } },
            nativeSend: (ws, data) => Reflect.apply(NativeProtoSend, ws, [data])
          };
        }

        return { installWebSocketProxy };
      });

      /* ===== module: net/outgoing (loader/src/net/outgoing.js) ===== */
      (function (root, factory) {
        const value = factory();
        if (typeof module === "object" && module.exports) module.exports = value;
        if (typeof root !== "undefined") root.MooMooOutgoing = value;
        if (typeof globalThis !== "undefined") globalThis.MooMooOutgoing = value;
      })(typeof self !== "undefined" ? self : this, function () {
        "use strict";

        const RATE_MARGIN = 0.9;
        const BURST_RESERVE = 2;
        const NEVER_DROP = new Set(["T", "M"]);

        class Bucket {
          constructor(spec, now) {
            const [perSecond, burst] = spec;
            this.rate = (perSecond * RATE_MARGIN) / 1000;
            this.capacity = Math.max(1, burst - BURST_RESERVE);
            this.tokens = this.capacity;
            this.updated = now;
          }
          refill(now) {
            this.tokens = Math.min(this.capacity, this.tokens + (now - this.updated) * this.rate);
            this.updated = now;
          }
          canTake(now) { this.refill(now); return this.tokens >= 1; }
          take() { this.tokens -= 1; }
        }

        function createOutgoing(opts) {
          opts = opts || {};
          const limits = opts.rateLimits || { global: [150, 300], packets: {} };
          const clock = opts.now || (() => Date.now());

          let enabled = opts.enabled !== false;
          let global = new Bucket(limits.global, clock());
          const buckets = Object.create(null);
          const bucketFor = (wire, now) => {
            const spec = limits.packets[wire];
            if (!spec) return null;
            return buckets[wire] || (buckets[wire] = new Bucket(spec, now));
          };

          const stats = { sent: 0, refused: 0, refusedByType: Object.create(null), byType: Object.create(null) };
          const secondWindow = [];
          const minuteWindow = [];
          const refusedTaps = new Set();

          function prune(now) {
            while (secondWindow.length && now - secondWindow[0] > 1000) secondWindow.shift();
            while (minuteWindow.length && now - minuteWindow[0] > 60000) minuteWindow.shift();
          }

          function allow(wire) {
            const now = clock();
            if (!enabled || NEVER_DROP.has(wire)) {
              const b = bucketFor(wire, now);
              global.refill(now); if (global.tokens >= 1) global.take();
              if (b) { b.refill(now); if (b.tokens >= 1) b.take(); }
              return true;
            }
            const b = bucketFor(wire, now);
            if (!global.canTake(now) || (b && !b.canTake(now))) {
              stats.refused++;
              stats.refusedByType[wire] = (stats.refusedByType[wire] || 0) + 1;
              for (const fn of refusedTaps) { try { fn(wire); } catch (_) {} }
              return false;
            }
            global.take();
            if (b) b.take();
            return true;
          }

          function wouldAllow(wire) {
            const now = clock();
            if (!enabled || NEVER_DROP.has(wire)) return true;
            const b = bucketFor(wire, now);
            return global.canTake(now) && (!b || b.canTake(now));
          }

          function tokens(wire) {
            const now = clock();
            const b = bucketFor(wire, now);
            if (!b) return Infinity;
            b.refill(now);
            return b.tokens;
          }

          function record(wire) {
            const now = clock();
            stats.sent++;
            stats.byType[wire] = (stats.byType[wire] || 0) + 1;
            secondWindow.push(now);
            minuteWindow.push(now);
            prune(now);
          }

          const pingSamples = [];
          let pingSentAt = 0;
          let lastPing = 0;

          function onPingSent() { pingSentAt = clock(); }
          function onPong() {
            if (!pingSentAt) return null;
            lastPing = Math.max(0, clock() - pingSentAt);
            pingSentAt = 0;
            pingSamples.push(lastPing);
            if (pingSamples.length > 4) pingSamples.shift();
            return lastPing;
          }
          function avgPing() {
            if (!pingSamples.length) return 0;
            let sum = 0;
            for (let i = 0; i < pingSamples.length; i++) sum += pingSamples[i];
            return sum / pingSamples.length;
          }
          function minPing() {
            if (!pingSamples.length) return 0;
            return Math.min.apply(null, pingSamples);
          }

          function reset() {
            const now = clock();
            global = new Bucket(limits.global, now);
            for (const k of Object.keys(buckets)) delete buckets[k];
            pingSentAt = 0;
          }

          return {
            allow, wouldAllow, tokens, record,
            perSecond: () => { prune(clock()); return secondWindow.length; },
            perMinute: () => { prune(clock()); return minuteWindow.length; },
            stats,
            onRefused: (fn) => { refusedTaps.add(fn); return () => refusedTaps.delete(fn); },
            onPingSent, onPong,
            get ping() { return lastPing; },
            avgPing, minPing,
            setEnabled: (b) => { enabled = !!b; },
            get enabled() { return enabled; },
            reset,
            RATE_MARGIN, BURST_RESERVE
          };
        }

        return { createOutgoing, Bucket };
      });

      /* ===== module: core/runtime (loader/src/core/runtime.js) ===== */
      (function (root, factory) {
        const vocab = (typeof require === "function") ? require("../../../shared/vocabulary.js") : root.MooMooVocabulary;
        const value = factory(vocab);
        if (typeof module === "object" && module.exports) module.exports = value;
        if (typeof root !== "undefined") root.MooMooRuntime = value;
        if (typeof globalThis !== "undefined") globalThis.MooMooRuntime = value;
      })(typeof self !== "undefined" ? self : this, function (vocab) {
        "use strict";

        function createRuntime(options) {
          const opts = options || {};
          const sink = opts.sink || { sendAction() {}, sendRaw() {} };
          const logPrefix = opts.logPrefix || "%c[moomoo.js]";
          const logStyle = opts.logStyle || "color:#7cc;font-weight:bold";

          const listeners = new Map();
          const readyCbs = [];
          let ready = false;
          let ctxExtensions = opts.ctxExtensions || null;

          const players = new Map();
          const DEFAULT_WEAPONS = [0];
          const DEFAULT_ITEMS = [0, 3, 6, 10];
          const self = {
            sid: -1, alive: false, health: 0, x: 0, y: 0, dir: 0,
            weaponIndex: 0, buildIndex: -1, hat: 0, accessory: 0,
            weapons: DEFAULT_WEAPONS.slice(), items: DEFAULT_ITEMS.slice()
          };

          function playerFor(sid) {
            let pl = players.get(sid);
            if (!pl) { pl = { sid }; players.set(sid, pl); }
            return pl;
          }

          function updateState(event, payload) {
            switch (event) {
              case "setup":
                self.sid = payload.sid;
                self.alive = true;
                self.weapons = DEFAULT_WEAPONS.slice();
                self.items = DEFAULT_ITEMS.slice();
                playerFor(payload.sid);
                break;
              case "health": {
                const pl = playerFor(payload.sid);
                pl.health = payload.value;
                if (payload.sid === self.sid) self.health = payload.value;
                break;
              }
              case "playerAdd":
                if (payload.isYou && Array.isArray(payload.data)) {
                  self.alive = true;
                  self.weapons = DEFAULT_WEAPONS.slice();
                  self.items = DEFAULT_ITEMS.slice();
                }
                break;
              case "playerRemove":
                players.delete(payload.sid);
                break;
              case "playersUpdate":
                for (const pos of payload.positions) {
                  const pl = playerFor(pos.sid);
                  pl.x = pos.x; pl.y = pos.y; pl.dir = pos.dir; pl.visible = true;
                  if (pos.sid === self.sid) { self.x = pos.x; self.y = pos.y; self.dir = pos.dir; }
                }
                if (payload.attributes) {
                  for (const at of payload.attributes) {
                    const pl = playerFor(at.sid);
                    pl.weaponIndex = at.weaponIndex; pl.buildIndex = at.buildIndex;
                    pl.variant = at.variant; pl.team = at.team; pl.isLeader = at.isLeader;
                    pl.skin = at.skin; pl.tail = at.tail; pl.icon = at.icon; pl.zIndex = at.zIndex;
                    if (at.sid === self.sid) {
                      self.weaponIndex = at.weaponIndex; self.buildIndex = at.buildIndex;
                      self.hat = at.skin; self.accessory = at.tail; self.team = at.team;
                      self.weaponVariant = at.variant; self.isLeader = at.isLeader;
                      self.icon = at.icon; self.zIndex = at.zIndex;
                    }
                  }
                }
                for (const sid of payload.hidden) {
                  const pl = players.get(sid);
                  if (pl) pl.visible = false;
                }
                break;
              case "inventory":
                if (payload.isWeapon) self.weapons = payload.list || [];
                else self.items = payload.list || [];
                break;
              case "playerValue":
                if (payload.key !== "__proto__" && payload.key !== "constructor" && payload.key !== "prototype") {
                  self[payload.key] = payload.value;
                }
                break;
              case "died":
                self.alive = false;
                break;
            }
          }

          function on(event, handler) {
            if (event !== "*" && !vocab.isEvent(event)) console.warn(logPrefix + " unknown event: " + event, logStyle);
            let set = listeners.get(event);
            if (!set) { set = new Set(); listeners.set(event, set); }
            set.add(handler);
            return () => off(event, handler);
          }
          function off(event, handler) {
            const set = listeners.get(event);
            if (set) set.delete(handler);
          }
          function once(event, handler) {
            const wrap = (payload) => { off(event, wrap); handler(payload); };
            return on(event, wrap);
          }

          const outFilters = new Map();
          const sentTaps = new Set();
          function onOutgoing(action, fn) {
            let set = outFilters.get(action);
            if (!set) { set = new Set(); outFilters.set(action, set); }
            set.add(fn);
            return () => set.delete(fn);
          }
          function _filterOutgoing(action, payload, info) {
            let cur = payload;
            const sets = [outFilters.get(action), outFilters.get("*")];
            for (const set of sets) {
              if (!set) continue;
              for (const fn of Array.from(set)) {
                let r;
                try { r = fn(cur, info || {}, action); }
                catch (e) { console.error(logPrefix + " outgoing filter for '" + action + "' threw", logStyle, e); continue; }
                if (r === false || r === null) return null;
                if (r && typeof r === "object") cur = r;
              }
            }
            return cur;
          }
          function onSent(fn) { sentTaps.add(fn); return () => sentTaps.delete(fn); }
          function _notifySent(action, payload, source) {
            for (const fn of Array.from(sentTaps)) { try { fn(action, payload, source); } catch (_) {} }
          }

          function _dispatch(event, payload) {
            updateState(event, payload);
            const set = listeners.get(event);
            if (set) {
              for (const h of Array.from(set)) {
                try { h(payload); }
                catch (e) { console.error(logPrefix + " handler for '" + event + "' threw", logStyle, e); }
              }
            }
            const star = listeners.get("*");
            if (star) for (const h of Array.from(star)) { try { h(event, payload); } catch (_) {} }
          }

          function _setReady(value) {
            if (ready) return;
            ready = value !== false;
            if (!ready) return;
            while (readyCbs.length) {
              const cb = readyCbs.shift();
              try { cb(); } catch (e) { console.error(logPrefix + " onReady callback threw", logStyle, e); }
            }
          }

          function onReady(cb) {
            if (ready) { try { cb(); } catch (e) { console.error(e); } }
            else readyCbs.push(cb);
          }

          function _reset() {
            players.clear();
            self.sid = -1; self.alive = false; self.health = 0; self.x = 0; self.y = 0; self.dir = 0;
            self.weaponIndex = 0; self.buildIndex = -1; self.hat = 0; self.accessory = 0;
            self.weapons = DEFAULT_WEAPONS.slice(); self.items = DEFAULT_ITEMS.slice();
          }

          const send = {};
          for (const action of vocab.actionNames) {
            const spec = vocab.actions[action];
            const pnames = spec.params.map((x) => x.name);
            send[action] = function () {
              const a = arguments;
              let payload;
              if (a.length === 1 && a[0] && typeof a[0] === "object" && !Array.isArray(a[0]) && pnames.some((n) => n in a[0])) {
                payload = a[0];
              } else {
                payload = {};
                for (let i = 0; i < pnames.length; i++) payload[pnames[i]] = a[i];
              }
              return sink.sendAction(action, payload);
            };
          }
          send.raw = (wire, args) => sink.sendRaw(wire, args || []);

          const mods = new Map();
          const modListeners = new Set();
          const STORE_PREFIX = "moomoojs:mod:";
          const CFG_PREFIX = "moomoojs:cfg:";
          const LEGACY = { "mml_v1": CFG_PREFIX + "lite" };
          const LEGACY_DROP = ["mmp_menu_v1", "mmp_menu_v2", "mmp_stock_look_v1"];
          const mem = Object.create(null);
          const ls = () => { try { return (typeof localStorage !== "undefined") ? localStorage : null; } catch (e) { return null; } };

          (function hydrate() {
            const s = ls(); if (!s) return;
            try {
              const keys = [];
              for (let i = 0; i < s.length; i++) keys.push(s.key(i));
              for (const k of keys) {
                if (k && (k.indexOf(STORE_PREFIX) === 0 || k.indexOf(CFG_PREFIX) === 0)) {
                  try { mem[k] = JSON.parse(s.getItem(k)); } catch (e) { mem[k] = {}; }
                  s.removeItem(k);
                } else if (k && LEGACY[k]) {
                  try { mem[LEGACY[k]] = JSON.parse(s.getItem(k)); } catch (e) {}
                  s.removeItem(k);
                } else if (k && LEGACY_DROP.indexOf(k) >= 0) {
                  s.removeItem(k);
                }
              }
            } catch (e) {}
          })();

          function flush() {
            const s = ls(); if (!s) return;
            for (const k of Object.keys(mem)) {
              try { s.setItem(k, JSON.stringify(mem[k])); } catch (e) {}
            }
          }

          try {
            if (typeof window !== "undefined" && window.addEventListener) {
              window.addEventListener("pagehide", flush, false);
              window.addEventListener("beforeunload", flush, false);
            }
          } catch (e) {}

          function loadPersist(id) { const v = mem[STORE_PREFIX + id]; return (v && typeof v === "object") ? v : {}; }
          function savePersist(id, data) { mem[STORE_PREFIX + id] = data; }
          const config = {
            get(id) { const v = mem[CFG_PREFIX + id]; return (v && typeof v === "object") ? v : null; },
            set(id, obj) { mem[CFG_PREFIX + id] = obj; }
          };

          const slug = (s) => String(s || "mod").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "mod";
          const titleCase = (s) => String(s).replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

          function normalizeSetting(s) {
            const type = s.type || (typeof s.default === "boolean" ? "boolean" : typeof s.default === "number" ? "number" : s.options ? "select" : "string");
            return {
              key: s.key, type,
              default: s.default !== undefined ? s.default : (type === "boolean" ? false : type === "number" ? 0 : type === "key" ? "" : ""),
              label: s.label || titleCase(s.key),
              options: s.options || null,
              min: s.min, max: s.max, step: s.step,
              category: s.category || null,
              hint: s.hint || null,
              basic: !!s.basic
            };
          }

          function emitModsChanged() {
            const list = getMods();
            for (const fn of Array.from(modListeners)) { try { fn(list); } catch (_) {} }
          }

          function buildCtx(rec) {
            const active = { unsubs: [], timers: [], timeouts: [], cleanups: [] };
            const settings = {};
            for (const s of rec.schema) {
              Object.defineProperty(settings, s.key, {
                get: () => rec.values[s.key],
                set: (v) => { setSetting(rec.id, s.key, v); },
                enumerable: true
              });
            }
            rec._active = active;
            const ctx = {
              mod: { id: rec.id, name: rec.name, version: rec.version },
              settings,
              self, players,
              player: (sid) => players.get(sid),
              send,
              on: (ev, h) => { const un = on(ev, h); active.unsubs.push(un); return un; },
              once: (ev, h) => { const un = once(ev, h); active.unsubs.push(un); return un; },
              every: (ms, fn) => { const t = setInterval(fn, ms); active.timers.push(t); return t; },
              after: (ms, fn) => {
                const t = setTimeout(() => {
                  const i = active.timeouts.indexOf(t);
                  if (i >= 0) active.timeouts.splice(i, 1);
                  fn();
                }, ms);
                active.timeouts.push(t);
                return t;
              },
              onOutgoing: (action, fn) => { const un = onOutgoing(action, fn); active.unsubs.push(un); return un; },
              onSent: (fn) => { const un = onSent(fn); active.unsubs.push(un); return un; },
              onCleanup: (fn) => { active.cleanups.push(fn); },
              onSettingChange: (fn) => {
                rec.settingCbs.add(fn);
                const rm = () => rec.settingCbs.delete(fn);
                active.cleanups.push(rm);
                return rm;
              },
              setSetting: (key, value) => setSetting(rec.id, key, value),
              log: function () { console.log(logPrefix + " " + rec.name, logStyle, ...arguments); }
            };
            if (ctxExtensions) {
              try {
                const extra = typeof ctxExtensions === "function" ? ctxExtensions(ctx, rec, active) : ctxExtensions;
                if (extra) for (const k in extra) if (!(k in ctx)) ctx[k] = extra[k];
              } catch (e) { console.error(logPrefix + " ctxExtensions threw", logStyle, e); }
            }
            return ctx;
          }

          function teardown(rec) {
            const a = rec._active;
            if (!a) return;
            for (const un of a.unsubs) { try { un(); } catch (_) {} }
            for (const t of a.timers) { try { clearInterval(t); } catch (_) {} }
            for (const t of a.timeouts) { try { clearTimeout(t); } catch (_) {} }
            for (const c of a.cleanups) { try { c(); } catch (_) {} }
            rec._active = null;
          }

          function runSetup(rec) {
            const ctx = buildCtx(rec);
            try {
              const cleanup = rec.setup(ctx);
              if (typeof cleanup === "function") rec._active.cleanups.push(cleanup);
              return true;
            } catch (e) {
              console.error(logPrefix + " mod '" + rec.id + "' setup threw", logStyle, e);
              teardown(rec);
              return false;
            }
          }

          function register(meta, setup) {
            meta = meta || {};
            const id = meta.id || slug(meta.name);
            if (mods.has(id)) { console.warn(logPrefix + " mod already registered: " + id, logStyle); return mods.get(id); }
            const schema = (meta.settings || []).map(normalizeSetting);
            const persisted = loadPersist(id);
            const values = {};
            for (const s of schema) values[s.key] = (persisted.settings && s.key in persisted.settings) ? persisted.settings[s.key] : s.default;
            const rec = {
              id, name: meta.name || id, version: meta.version || "1.0.0",
              description: meta.description || "", schema, setup, values,
              enabled: false, _active: null,
              reapply: !(meta.liveSettings === true || meta.reapplyOnSettingChange === false),
              settingCbs: new Set(),
              menu: meta.menu,
              menuHint: meta.menuHint || null
            };
            mods.set(id, rec);
            const startEnabled = persisted.enabled !== undefined ? persisted.enabled : (meta.defaultEnabled !== false);
            if (startEnabled && runSetup(rec)) rec.enabled = true;
            savePersist(id, { enabled: rec.enabled, settings: rec.values });
            emitModsChanged();
            return rec;
          }

          function enable(id) {
            const rec = mods.get(id);
            if (!rec || rec.enabled) return;
            if (runSetup(rec)) { rec.enabled = true; savePersist(id, { enabled: true, settings: rec.values }); emitModsChanged(); }
          }
          function disable(id) {
            const rec = mods.get(id);
            if (!rec || !rec.enabled) return;
            teardown(rec);
            rec.enabled = false;
            savePersist(id, { enabled: false, settings: rec.values });
            emitModsChanged();
          }
          function setModEnabled(id, on_) { on_ ? enable(id) : disable(id); }

          function setSetting(id, key, value) {
            const rec = mods.get(id);
            if (!rec) return;
            const old = rec.values[key];
            rec.values[key] = value;
            savePersist(id, { enabled: rec.enabled, settings: rec.values });
            if (rec.enabled) {
              if (rec.reapply) { teardown(rec); runSetup(rec); }
              else for (const cb of Array.from(rec.settingCbs)) { try { cb(key, value, old); } catch (_) {} }
            }
            emitModsChanged();
          }

          function getMods() {
            return Array.from(mods.values()).map((rec) => ({
              id: rec.id, name: rec.name, version: rec.version, description: rec.description,
              enabled: rec.enabled, hasSettings: rec.schema.length > 0, menu: rec.menu, menuHint: rec.menuHint,
              settings: rec.schema.map((s) => ({
                key: s.key, type: s.type, label: s.label, options: s.options,
                min: s.min, max: s.max, step: s.step, category: s.category,
                hint: s.hint, basic: s.basic, value: rec.values[s.key]
              }))
            }));
          }

          function onModsChanged(cb) { modListeners.add(cb); return () => modListeners.delete(cb); }

          function _clearMods() {
            for (const rec of mods.values()) teardown(rec);
            mods.clear();
            emitModsChanged();
          }

          function log() { console.log(logPrefix, logStyle, ...arguments); }

          return {
            version: opts.version || "0.0.0",
            vocabulary: vocab,
            loader: opts.loaderInfo || {},
            state: { self, players },
            get self() { return self; },
            get players() { return players; },
            player: (sid) => players.get(sid),
            isReady: () => ready,
            on, off, once, onReady,
            onOutgoing, onSent,
            send,
            register, enable, disable, setModEnabled, setSetting, getMods, onModsChanged,
            isModEnabled: (id) => { const r = mods.get(id); return !!(r && r.enabled); },
            log,
            _dispatch, _setReady, _reset, _clearMods, _filterOutgoing, _notifySent,
            _config: config,
            _setCtxExtensions: (ext) => { ctxExtensions = ext; }
          };
        }

        return { createRuntime };
      });

      /* ===== module: game/input (loader/src/game/input.js) ===== */
      (function (root, factory) {
        const value = factory();
        if (typeof module === "object" && module.exports) module.exports = value;
        if (typeof root !== "undefined") root.MooMooInput = value;
        if (typeof globalThis !== "undefined") globalThis.MooMooInput = value;
      })(typeof self !== "undefined" ? self : this, function () {
        "use strict";

        function normKey(k) {
          if (k == null) return "";
          if (typeof k === "number") return "#" + k;
          let s = String(k);
          if (s.length > 1 && /^Key[A-Z]$/.test(s)) s = s.slice(3);
          if (s.length > 1 && /^Digit[0-9]$/.test(s)) s = s.slice(5);
          if (s === " ") s = "space";
          return s.toLowerCase();
        }

        function tokensFor(e) {
          const toks = [];
          if (e.key) toks.push(e.key === " " ? "space" : e.key.toLowerCase());
          if (e.code) {
            let c = e.code;
            if (/^Key[A-Z]$/.test(c)) c = c.slice(3);
            else if (/^Digit[0-9]$/.test(c)) c = c.slice(5);
            toks.push(c.toLowerCase());
          }
          if (typeof e.keyCode === "number") toks.push("#" + e.keyCode);
          return toks;
        }

        function isTyping(doc) {
          const el = doc.activeElement;
          if (!el) return false;
          const tag = (el.tagName || "").toLowerCase();
          return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable === true;
        }

        function installInput(win) {
          const doc = win.document;
          const down = new Set();
          const binds = new Map();
          const downCbs = new Set();
          const upCbs = new Set();
          const moveCbs = new Set();
          const mouse = { x: (win.innerWidth || 0) / 2, y: (win.innerHeight || 0) / 2, raw: null };

          function center() { return { x: (win.innerWidth || 0) / 2, y: (win.innerHeight || 0) / 2 }; }

          function onKeyDown(e) {
            const toks = tokensFor(e);
            for (const t of toks) down.add(t);
            const typing = isTyping(doc);
            for (const cb of Array.from(downCbs)) { try { cb(e, toks); } catch (_) {} }
            if (e.repeat) return;
            for (const t of new Set(toks)) {
              const set = binds.get(t);
              if (!set) continue;
              for (const b of Array.from(set)) {
                if (typing && !b.allowTyping) continue;
                if (b.preventDefault) e.preventDefault();
                try { b.fn(e); } catch (err) { console.error("[moomoo.js] keybind threw", err); }
              }
            }
          }

          function onKeyUp(e) {
            const toks = tokensFor(e);
            for (const t of toks) down.delete(t);
            for (const cb of Array.from(upCbs)) { try { cb(e, toks); } catch (_) {} }
          }

          function onBlur() { down.clear(); }
          function onMove(e) {
            mouse.x = e.clientX; mouse.y = e.clientY; mouse.raw = e;
            for (const cb of Array.from(moveCbs)) { try { cb(mouse, e); } catch (_) {} }
          }

          win.addEventListener("keydown", onKeyDown, true);
          win.addEventListener("keyup", onKeyUp, true);
          win.addEventListener("blur", onBlur);
          win.addEventListener("mousemove", onMove, true);

          return {
            mouse,
            center,
            isDown: (k) => down.has(normKey(k)),
            onKey(k, fn, opts) {
              const t = normKey(k);
              let set = binds.get(t);
              if (!set) { set = new Set(); binds.set(t, set); }
              const b = { fn, preventDefault: !!(opts && opts.preventDefault), allowTyping: !!(opts && opts.allowTyping) };
              set.add(b);
              return () => set.delete(b);
            },
            onKeyDown: (fn) => { downCbs.add(fn); return () => downCbs.delete(fn); },
            onKeyUp: (fn) => { upCbs.add(fn); return () => upCbs.delete(fn); },
            onMouseMove: (fn) => { moveCbs.add(fn); return () => moveCbs.delete(fn); },
            aimAngle() {
              const c = center();
              return Math.atan2(mouse.y - c.y, mouse.x - c.x);
            },
            isTyping: () => isTyping(doc),
            normKey,
            uninstall() {
              win.removeEventListener("keydown", onKeyDown, true);
              win.removeEventListener("keyup", onKeyUp, true);
              win.removeEventListener("blur", onBlur);
              win.removeEventListener("mousemove", onMove, true);
              binds.clear(); downCbs.clear(); upCbs.clear(); moveCbs.clear(); down.clear();
            }
          };
        }

        return { installInput, normKey };
      });

      /* ===== module: game/objects (loader/src/game/objects.js) ===== */
      (function (root, factory) {
        const value = factory();
        if (typeof module === "object" && module.exports) module.exports = value;
        if (typeof root !== "undefined") root.MooMooObjects = value;
        if (typeof globalThis !== "undefined") globalThis.MooMooObjects = value;
      })(typeof self !== "undefined" ? self : this, function () {
        "use strict";

        const TURRET_RELOAD = 2200;
        const GATHER_WIGGLE = 10;
        const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
        const hooksRef = { te: null, tick: () => 0, millRotate: () => false };

        class GameObject {
          constructor(sid) { this.sid = sid; }

          init(x, y, dir, scale, type, data, owner, bot, _unused, fake, restricter, preplace) {
            const o = data || {};
            this.sentTo = {};
            this.gridLocations = [];
            this.active = true;
            this.doUpdate = o.doUpdate;
            this.x = x; this.y = y; this.dir = dir;
            this.xWiggle = 0; this.yWiggle = 0;
            this.scale = scale;
            this.type = type;
            this.id = o.id;
            this.owner = owner;
            this.ownerSid = owner && owner.sid != null ? owner.sid : null;
            this.name = o.name ? o.name : this.type === 0 ? "Tree" : this.type === 1 && this.y >= 12e3 ? "Cactus" : this.type === 1 ? "Bush" : this.type === 2 ? "Stone" : this.type === 3 ? "Gold Stone" : null;
            this.isItem = this.id != null;
            this.group = o.group;
            this.health = this.maxHealth = o.health;
            this.health2 = 0;
            this.buildingID = o.buildingID;
            this.setType = o.setType;
            this.layer = 2;
            this.group != null ? this.layer = this.group.layer : this.type == 0 ? this.layer = 3 : this.type == 2 ? this.layer = 0 : this.type == 4 && (this.layer = -1);
            this.colDiv = o.colDiv || 1;
            this.blocker = o.blocker;
            this.ignoreCollision = o.ignoreCollision;
            this.dontGather = o.dontGather;
            this.hideFromEnemy = o.hideFromEnemy;
            this.friction = o.friction;
            this.projDmg = o.projDmg;
            this.dmg = o.dmg;
            this.pDmg = o.pDmg;
            this.pps = o.pps;
            this.zIndex = o.zIndex || 0;
            this.turnSpeed = o.turnSpeed;
            this.req = o.req;
            this.trap = o.trap;
            this.healCol = o.healCol;
            this.teleport = o.teleport;
            this.boostSpeed = o.boostSpeed;
            this.projectile = o.projectile;
            this.opacity = 1;
            this.opacity2 = 1;
            this.fadingOut = false;
            this.dmgpot = 0;
            this.assumeBreak = false;
            this.ignoreWiggleDirs = [];
            this.wiggleDirs = [];
            this.shootRange = o.shootRange;
            this.shootRate = o.shootRate;
            this.shootCount = this.shootRate;
            this.spawnPoint = o.spawnPoint;
            this.tick = hooksRef.tick();
            this.preplace = preplace;
            this.fake = fake;
            this.bot = bot;
            this.elevation = (typeof this.type === "number" && this.owner === null) || this.name == "turret" || this?.group?.name === "mill" ? 2 : 1;
            this.restricter = restricter;
            this.realScale = this.type <= 1 && this.type !== null ? this.scale * 0.6 : this.scale;
            const te = hooksRef.te || (() => false);
            this.pathScale = this.type === 1 && this.y <= 12e3 ? this.scale * 0.6 + 15
              : this.type === 0 ? this.scale * 0.7 + 10
              : (this.dmg && !te(this?.owner?.sid)) || this.teleport || this.boostSpeed ? this.scale + 47
              : this.type === 1 && this.y >= 12e3 ? this.scale * 0.55 + 47
              : this.name == "pit trap" && !te(this?.owner?.sid) ? this.scale + 38
              : this.ignoreCollision ? 0 : this.scale + 10;
            this.time = this.name === "turret" ? TURRET_RELOAD : undefined;
            this.shot = 0;
            this.lastHit = 0;
            this.distance = 0;
            return this;
          }

          changeHealth(e) { this.health += e; return this.health <= 0; }

          update(e) {
            if (!this.active) return;
            if (this.xWiggle) this.xWiggle *= Math.pow(0.99, e);
            if (this.yWiggle) this.yWiggle *= Math.pow(0.99, e);
            if ((hooksRef.millRotate() && this?.group?.name == "mill") || this?.group?.name != "mill") {
              if (this.turnSpeed) this.dir += this.turnSpeed * e;
            }
          }

          getScale(e, t) {
            e = e || 1;
            return this.scale * (this.isItem || this.type == 2 || this.type == 3 || this.type == 4 ? 1 : 0.6 * e) * (t ? 1 : this.colDiv);
          }

          visibleToPlayer(e) {
            return !this.hideFromEnemy || (this.owner && (this.owner == e || (this.owner.team && e.team == this.owner.team)));
          }
        }

        function createObjectManager(env) {
          const MooMoo = env.MooMoo;
          const data = env.data;
          const S = () => MooMoo.self;

          const byId = new Map();
          const list = [];
          const itemCounts = Object.create(null);

          function indexOfSid(sid) {
            for (let i = 0; i < list.length; i++) if (list[i].sid === sid) return i;
            return -1;
          }

          const removeTaps = new Set();
          function tapRemove(o, cause) { for (const fn of Array.from(removeTaps)) { try { fn(o, cause); } catch (_) {} } }
          function removeSid(sid) {
            const o = byId.get(sid);
            if (!o) return;
            tapRemove(o, "killed");
            byId.delete(sid);
            const i = indexOfSid(sid);
            if (i >= 0) list.splice(i, 1);
          }

          function clearAll() { byId.clear(); list.length = 0; }

          function isSelf(sid) { const s = S(); return s != null && sid === s.sid; }
          function isTeammate(sid) {
            if (sid == null) return false;
            if (isSelf(sid)) return true;
            const me = S(); if (!me || me.team == null) return false;
            const p = MooMoo.players && MooMoo.players.get(sid);
            return !!(p && p.team != null && p.team === me.team);
          }
          function isFriendly(sid) { return isSelf(sid) || isTeammate(sid); }
          function isEnemyObject(o) { return o != null && o.ownerSid != null && !isFriendly(o.ownerSid); }

          function addObject(sid, x, y, dir, scale, type, id, ownerSid) {
            const def = (id != null && id >= 0) ? data.item(id) : null;
            const o = new GameObject(sid);
            const old = byId.get(sid);
            if (old) { const k = list.indexOf(old); if (k >= 0) list.splice(k, 1); }
            byId.set(sid, o); list.push(o);
            o.init(x, y, dir, scale, type, def, ownerSid >= 0 && ownerSid != null ? { sid: ownerSid } : null);
            return o;
          }

          function onObjectsLoad(p) {
            const flat = (p && p.args && p.args[0]) || [];
            for (let n = 0; n + 7 < flat.length; n += 8) {
              addObject(flat[n], flat[n + 1], flat[n + 2], flat[n + 3], flat[n + 4], flat[n + 5], flat[n + 6], flat[n + 7]);
            }
          }
          function onObjectKilled(p) {
            const sid = p && p.args && p.args[0];
            if (sid != null) removeSid(sid);
          }
          function onObjectsKilled(p) {
            const owner = p && p.args && p.args[0];
            if (owner == null) return;
            for (let i = list.length - 1; i >= 0; i--) {
              if (list[i].ownerSid === owner) { tapRemove(list[i], "ownerLeft"); byId.delete(list[i].sid); list.splice(i, 1); }
            }
          }
          function onWiggle(p) {
            const a = p && p.args; if (!a) return;
            const dir = a[0], sid = a[1];
            const o = byId.get(sid);
            if (!o) return;
            o.xWiggle += GATHER_WIGGLE * Math.cos(dir);
            o.yWiggle += GATHER_WIGGLE * Math.sin(dir);
            o.lastHit = Date.now();
          }
          function onTurretShoot(p) {
            const a = p && p.args; if (!a) return;
            const sid = a[0], dir = a[1];
            const o = byId.get(sid);
            if (!o) return;
            if (dir != null) o.dir = dir;
            o.time = TURRET_RELOAD;
            o.shot = Date.now();
            o.NOW = false;
          }
          function onItemCount(p) {
            const a = p && p.args; if (!a) return;
            itemCounts[a[0]] = a[1];
          }

          let lastTick = 0;
          let driven = false;
          function update(deltaOverride) {
            const now = Date.now();
            const delta = deltaOverride != null ? deltaOverride : (lastTick ? (now - lastTick) : 111);
            lastTick = now;
            for (let i = 0; i < list.length; i++) {
              const o = list[i];
              if (o.name === "turret" && o.time) {
                o.time -= delta;
                if (o.time <= 0) o.time = TURRET_RELOAD;
              }
              if (!driven && o.turnSpeed) o.dir += o.turnSpeed * delta;
            }
          }

          MooMoo.on("objectsLoad", onObjectsLoad);
          MooMoo.on("objectKilled", onObjectKilled);
          MooMoo.on("objectsKilled", onObjectsKilled);
          MooMoo.on("wiggle", onWiggle);
          MooMoo.on("turretShoot", onTurretShoot);
          MooMoo.on("itemCount", onItemCount);
          MooMoo.on("playersUpdate", () => { if (!driven) update(); });

          let firstSetup = true;
          function newConnection() { clearAll(); firstSetup = true; }
          MooMoo.on("setup", () => { if (firstSetup) { firstSetup = false; clearAll(); } });

          function near(x, y, range, filter) {
            const out = [];
            for (let i = 0; i < list.length; i++) {
              const o = list[i];
              if (!o.active) continue;
              const d = dist(x, y, o.x, o.y);
              o.distance = d;
              if (range != null && d > range) continue;
              if (filter && !filter(o)) continue;
              out.push(o);
            }
            out.sort((a, b) => a.distance - b.distance);
            return out;
          }

          const byGroup = (gname) => (o) => o.group && o.group.name === gname;

          function trapAt(x, y, pad) {
            pad = pad == null ? 47 : pad;
            let best = null, bd = Infinity;
            for (let i = 0; i < list.length; i++) {
              const o = list[i];
              if (!o.active || o.name !== "pit trap") continue;
              const d = dist(x, y, o.x, o.y);
              if (d <= pad && d < bd) { bd = d; best = o; }
            }
            return best;
          }

          return {
            GameObject,
            _list: list, _byId: byId,
            get: (sid) => byId.get(sid) || null,
            all: () => list.slice(),
            count: () => list.length,
            near, trapAt,
            spikes: (x, y, range) => near(x, y, range, byGroup("spikes")),
            walls: (x, y, range) => near(x, y, range, byGroup("walls")),
            mills: (x, y, range) => near(x, y, range, byGroup("mill")),
            traps: (x, y, range) => near(x, y, range, (o) => o.name === "pit trap"),
            turrets: (x, y, range) => near(x, y, range, (o) => o.name === "turret"),
            buildings: (x, y, range) => near(x, y, range, (o) => o.ownerSid != null),
            isEnemyObject, isFriendly, isTeammate, isSelf,
            itemCount: (gid) => itemCounts[gid] || 0,
            clear: clearAll,
            newConnection,
            update,
            setDriven: (b) => { driven = !!b; },
            setFriendlyTest: (fn) => { hooksRef.te = fn; },
            onRemove: (fn) => { removeTaps.add(fn); return () => removeTaps.delete(fn); },
            setTickSource: (fn) => { hooksRef.tick = fn; },
            setMillRotate: (fn) => { hooksRef.millRotate = typeof fn === "function" ? fn : () => false; },
            TURRET_RELOAD
          };
        }

        return { createObjectManager, GameObject, TURRET_RELOAD };
      });

      /* ===== module: game/store (loader/src/game/store.js) ===== */
      (function (root, factory) {
        const value = factory();
        if (typeof module === "object" && module.exports) module.exports = value;
        if (typeof root !== "undefined") root.MooMooStore = value;
        if (typeof globalThis !== "undefined") globalThis.MooMooStore = value;
      })(typeof self !== "undefined" ? self : this, function () {
        "use strict";

        const BUY = 0, EQUIP = 1;

        function createStore(env) {
          const MooMoo = env.MooMoo;
          const data = env.data;

          const FREE_HATS = data.hats.filter((h) => h.price <= 0 && !h.dontSell).map((h) => h.id);
          const FREE_TAILS = data.accessories.filter((a) => a.price <= 0 && !a.dontSell).map((a) => a.id);

          const ownedHats = FREE_HATS.slice();
          const ownedTails = FREE_TAILS.slice();
          let hat = null;
          let tail = null;
          const listeners = new Set();
          const emit = (ev) => { for (const fn of Array.from(listeners)) { try { fn(ev); } catch (_) {} } };

          function onStoreUpdate(p) {
            const a = p && p.args; if (!a) return;
            const action = a[0], id = a[1], isTail = !!a[2];
            if (action) {
              if (isTail) { tail = id; MooMoo.self.accessory = id; }
              else { hat = id; MooMoo.self.hat = id; }
            }
            if (action === 0 && id !== 0) {
              if (isTail) { if (ownedTails.indexOf(id) < 0) ownedTails.push(id); }
              else if (ownedHats.indexOf(id) < 0) ownedHats.push(id);
            }
            emit({ action: action ? "equip" : "buy", id, isAccessory: isTail });
          }

          function reset() {
            ownedHats.length = 0; ownedHats.push(...FREE_HATS);
            ownedTails.length = 0; ownedTails.push(...FREE_TAILS);
            hat = null; tail = null;
          }

          const ownsHat = (id) => id === 0 || ownedHats.indexOf(id) >= 0;
          const ownsTail = (id) => id === 0 || ownedTails.indexOf(id) >= 0;

          const equipHatRaw = (id) => MooMoo.send.store(EQUIP, id | 0, false);
          const equipTailRaw = (id) => MooMoo.send.store(EQUIP, id | 0, true);
          const buyHat = (id) => MooMoo.send.store(BUY, id | 0, false);
          const buyTail = (id) => MooMoo.send.store(BUY, id | 0, true);

          function equip(hatId, accessoryId) {
            if (hatId === undefined) hatId = null;
            if (accessoryId === undefined) accessoryId = null;
            if (hatId !== null && !isNaN(hatId)) {
              if (ownedHats.indexOf(hatId) < 0) {
                if (hat !== 0) equipHatRaw(0);
              } else if (hat !== hatId) {
                equipHatRaw(hatId);
              }
            }
            if (accessoryId !== null && !isNaN(accessoryId)) {
              if (ownedTails.indexOf(accessoryId) < 0) {
                if (tail !== 0) equipTailRaw(0);
              } else if (tail !== accessoryId) {
                equipTailRaw(accessoryId);
              }
            }
          }

          MooMoo.on("storeUpdate", onStoreUpdate);

          return {
            get ownedHats() { return ownedHats; },
            get ownedTails() { return ownedTails; },
            get hat() { return hat; },
            get tail() { return tail; },
            ownsHat, ownsTail,
            equip, equipHat: equipHatRaw, equipTail: equipTailRaw, buyHat, buyTail,
            onChange: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
            reset,
            forgetEquipped: () => { hat = null; tail = null; },
            FREE_HATS, FREE_TAILS, BUY, EQUIP
          };
        }

        return { createStore, BUY, EQUIP };
      });

      /* ===== module: game/combat (loader/src/game/combat.js) ===== */
      (function (root, factory) {
        const value = factory();
        if (typeof module === "object" && module.exports) module.exports = value;
        if (typeof root !== "undefined") root.MooMooCombat = value;
        if (typeof globalThis !== "undefined") globalThis.MooMooCombat = value;
      })(typeof self !== "undefined" ? self : this, function () {
        "use strict";

        const K = {
          mapScale: 14400, riverWidth: 724, snowBiomeTop: 2400, snowSpeed: 0.75,
          playerScale: 35, playerSpeed: 0.0016, gatherAngle: Math.PI / 2.6, gatherWiggle: 10,
          maxScreenWidth: 1920, maxScreenHeight: 1080, serverUpdateRate: 9, clientSendRate: 5,
          shieldAngle: Math.PI / 3, hitReturnRatio: 0.25, hitAngle: Math.PI / 2,
          weaponVariants: [
            { id: 0, src: "", xp: 0, val: 1 },
            { id: 1, src: "_g", xp: 3000, val: 1.1 },
            { id: 2, src: "_d", xp: 7000, val: 1.18 },
            { id: 3, src: "_r", poison: true, xp: 12000, val: 1.18 },
            { id: 4, src: "_e", xp: 20000, val: 1.18, lifesteal: 0.15, membersOnly: true }
          ]
        };
        const ce = 1000 / 9;
        const u = ce * 2;
        const r3 = Math.pow(0.993, 111);
        const EN = [1, 1.1, 1.18, 1.18, 1.18];
        const h = Math.PI / 2.6;

        const U = Math.cos, V = Math.sin, P = Math.atan2, S = Math.abs;
        const D = Math.sqrt;
        const re = (a, b) => Math.pow(a, b);
        const H = Math.round, j = Math.min, oe = Math.max;
        const TAU = Math.PI * 2, W = Math.PI;
        const getDistance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
        const getDirection = (x1, y1, x2, y2) => Math.atan2(y1 - y2, x1 - x2);
        function getAngleDist(a, b) { const d = S(b - a) % TAU; return d > W ? TAU - d : d; }
        function Ay(e, t) { let n = S(e - t) % TAU; if (n > W) n = TAU - n; return n; }
        function lerpAngle(e, t, n) {
          if (S(t - e) > W) { if (e > t) t += TAU; else e += TAU; }
          const i = t + (e - t) * n;
          return i >= 0 && i <= TAU ? i : i % TAU;
        }
        const Ne = (t, n) => { const e = Math.SQRT2 - 1; t = S(t); n = S(n); if (t > n) { const x = t; t = n; n = x; } return e * t + n; };
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

        function createCombat(env) {
          const MooMoo = env.MooMoo;
          const data = env.data;
          const objects = env.objects || null;
          const selfInput = env.selfInput || { moveDir: null, aimDir: 0 };
          const win = env.win || (typeof window !== "undefined" ? window : null);
          if (objects && objects.setDriven) objects.setDriven(true);
          if (objects && objects.setFriendlyTest) objects.setFriendlyTest((sid) => te(sid));
          if (objects && objects.setTickSource) objects.setTickSource(() => v);

          const x = { list: data.items, weapons: data.weapons, projectiles: data.projectiles, groups: data.groups };
          const hatOf = (id) => data.hat(id), accOf = (id) => data.accessory(id);

          const z = MooMoo.self;
          let v = 0, et = 0, tn = 0, en = false;
          let Y = null;
          const xi = { ID: null, player: null };
          const J = [];
          let vn = [], Sn = [];
          let Xt = [], Q = [];
          const bh = [];
          let bosses = { Xi: null, Ji: null, qi: null };
          const Ln = [];
          let ng = [];
          const ft = [];
          let py = [];
          const rn = [], an = [], ln = [];
          const Xe = Object.create(null);
          let Ve = [];
          let pn = [];
          const hooks = {
            preTick: new Set(), tickStart: new Set(), postReconstruct: new Set(), afterSleep: new Set(),
            deferredFlushed: new Set(), afterPlayers: new Set(), frame: new Set(), frameLate: new Set(), framePlayer: new Set(),
            projectile: new Set(), playerAdded: new Set(), playerLeft: new Set(), buildingDamage: new Set(),
            died: new Set(), setup: new Set()
          };
          const runHooks = (set, a, b, c) => {
            for (const fn of Array.from(set)) { try { fn(a, b, c); } catch (e) { console.error("[moomoo.js] combat hook threw", e); } }
          };

          function A4() { return new Promise((e) => { Ve[Ve.length] = e; }); }

          function te(t) {
            if (t == z.sid) return true;
            for (let e = 0; e < py.length; e += 2) if (t == py[e]) return true;
            return false;
          }

          function Hg(t) { for (let e = 0; e < J.length; ++e) if (J[e].sid == t) return J[e]; return null; }
          function jg(t) { for (let e = 0; e < J.length; ++e) if (J[e].id == t) return J[e]; return null; }
          function Wg(t) { for (let e = 0; e < bh.length; ++e) if (bh[e].sid == t) return bh[e]; return null; }

          const gx = (e) => (e.x2 || e.x);
          const gy = (e) => (e.y2 || e.y);
          function S4(e, t) { return getDistance(gx(e), gy(e), gx(t), gy(t)); }
          function se(e, t, n) {
            const i = n === "player" ? -1.8 * 35 : n === "object" ? -(t && t.scale) : 0;
            return getDistance(gx(e), gy(e), gx(t), gy(t)) + i;
          }
          function B(e, t) { return P((t.y2 || t.y) - (e.y2 || e.y), (t.x2 || t.x) - (e.x2 || e.x)); }
          function Dy(e, t) { return Math.hypot((e.x2 || e.x) - (t.x2 || t.x), (e.y2 || e.y) - (t.y2 || t.y)); }
          function P3(e, t, n, i) { if (n == undefined) return { x: z.x, y: z.y }; return { x: e + i * U(n), y: t + i * V(n) }; }
          function L3(e, t) {
            const n = S((e.x2 || e.x) - (t.x2 || t.x));
            const i = S((e.y2 || e.y) - (t.y2 || t.y));
            return n <= K.maxScreenWidth / 2 * 1.3 && i <= K.maxScreenHeight / 2 * 1.3;
          }
          const X5 = (e, t) => D(e * e + t * t);

          const weapon = (id) => data.weapon(id);
          const weaponSpeed = (id) => { const w = weapon(id); return (w && w.speed != null) ? w.speed : undefined; };
          const weaponRange = (id) => { const w = weapon(id); return (w && w.range != null) ? w.range : 0; };
          const variantVal = (vi) => EN[vi] || 1;

          function x4(t) {
            const w = weapon(t.weaponIndex);
            const sh = t.skinIndex ? hatOf(t.skinIndex) : null, ta = t.tailIndex ? accOf(t.tailIndex) : null;
            let e = ((t.buildIndex < 0) + 1) / 2 * ((w && w.spdMult) || 1) * ((t.skinIndex && sh && sh.spdMult) || 1)
              * ((t.tailIndex && ta && ta.spdMult) || 1)
              * (t.y2 <= K.snowBiomeTop ? ((t.skinIndex && sh && sh.coldM) ? 1 : 0.75) : 1);
            if (!t.zIndex && t.y2 >= K.mapScale / 2 - K.riverWidth / 2 && t.y2 <= K.mapScale / 2 + K.riverWidth / 2) {
              e *= (t.skinIndex && sh && sh.watrImm) ? 0.75 : 0.33;
            }
            return e;
          }

          function w4(t, e) {
            t = {
              buildIndex: t?.buildIndex ?? e?.buildIndex ?? -1,
              weaponIndex: t?.weaponIndex ?? e?.weaponIndex ?? null,
              skinIndex: t?.skinIndex ?? e?.skinIndex ?? null,
              tailIndex: t?.tailIndex ?? e?.tailIndex ?? null,
              y2: t?.y2 ?? e?.y2 ?? 0,
              zIndex: t?.zIndex ?? e?.zIndex ?? false
            };
            return (ce / 2) * x4(t);
          }

          function l4(e, t, n, i, s) {
            if (s == null) s = 111;
            if (!i) {
              if (e.sid == z.sid && t !== 0 && !t) t = selfInput.moveDir;
              else if (state.Nt && e.sid == z.sid) t = undefined;
              else if (!t && t !== 0) t = e.movDir;
            }
            let o = U(t), r = V(t);
            const a = D(o * o + r * r);
            if (a != 0) { o /= a; r /= a; }
            if (!n) n = e;
            const l = x4(n);
            e.speedXD = 0; e.speedYD = 0; e.predY = 0; e.predX = 0;
            if (o) e.speedXD += o * 0.0016 * l * s;
            if (r) e.speedYD += r * 0.0016 * l * s;
            if (e.speedXD) e.predX += e.speedXD * s;
            if (e.speedYD) e.predY += e.speedYD * s;
            const f = e.xVel * re(0.993, s), hh = e.yVel * re(0.993, s);
            const p = f + e.predX, m = hh + e.predY;
            const g = { x: e.x2 + p, y: e.y2 + m, type: "accel" };
            const y = { x: e.x2 + f, y: e.y2 + hh, type: "decel" };
            const xx = T(p, m, { x: e.x2 + p, y: e.y2 + m }, 0);
            const w = { x: e.x2, y: e.y2, type: "current" };
            const b = { x: p, y: m, type: "nextVel" };
            let real = g;
            const k = H(D(p * p + m * m));
            const I = s * 1.5 * U(t), So = s * 1.5 * V(t);
            const E = { x: e.x2 + I, y: e.y2 + So };
            if (Xe[e.sid]?.np != undefined && e.sid != z.sid) real = se(e, Xe[e.sid]?.np?.accel) > se(e, Xe[e.sid]?.np?.decel) && Ay(e.movDir, e.pmovDir) <= 0.3 ? y : g;
            if (e.sid == z.sid) real = (selfInput.moveDir == undefined || selfInput.moveDir == null) ? y : g;
            return { accel: g, decel: y, boostCoords: E, boostVel: { x: I, y: So }, nextVel: b, real, current: w, fullDecel: xx, xVel: p, spd: l, yVel: m, vel: k };

            function T(e, t, n, depth) {
              if (depth > 64 || isNaN(e) || isNaN(t)) return n;
              const i = e * r3, s = t * r3;
              if (e != i) { e = i; n.x += e; }
              if (t != s) { t = s; n.y += t; }
              if (e == i && t == s) return { x: n.x, y: n.y, type: "full decel" };
              return T(e, t, n, depth + 1);
            }
          }

          function a4(e, t, n, i, s = [], o, r, a) {
            r = { ...e };
            if (e.sid == z.sid && n !== 0 && !n) n = selfInput.moveDir;
            else if (state.Nt && e.sid == z.sid) n = undefined;
            else if (!n && n !== 0) n = e.movDir;
            a = l4(r, n);
            r.xVel = a.xVel; r.yVel = a.yVel; r.x2 = a.real.x; r.y2 = a.real.y;
            s.push(a);
            if (t - 1 <= 0) return s;
            return a4(r, t - 1, n, r, s);
          }

          function b4(e, t) {
            const i = x.list[t];
            if (!i || !e) return;
            if (i.group.name == "mill") e.windmill = i;
            if (i.group.name == "spikes") e.spike = i;
            if (i.name == "boost pad") e.spike = false;
            if (i.age == 7) e.utility = i;
            if (i.group.name == "walls") e.wall = i;
            if (i.group.name == "food") e.food = i;
            if (i.name == "spawn pad") e.spawnpad = true;
          }

          function g4(e) {
            let t = 0;
            const n = e.loadout;
            if (n?.spawnpad || weapon(e?.secondary)?.age == 9 || n?.spike?.age == 9) return 9;
            if (n?.utility) t = 7;
            if (t < weapon(e?.secondary)?.age) t = weapon(e?.secondary)?.age;
            if (t < weapon(e?.primary)?.age) t = weapon(e?.primary)?.age;
            if (t < n?.spike?.age) t = n.spike.age;
            if (t < n?.food?.age) t = n.food.age;
            if (t < n?.windmill?.age) t = n.windmill.age;
            if (t < n?.wall?.age) t = n.wall.age;
            if (e?.weaponIndex == 0) t = 1;
            if (e?.primary == 0 && t > 1) e.primary = undefined;
            return t;
          }

          const loadout = {
            ee: null, A: null, ry: null, ay: null, ly: null, cy: null, dy: null, uy: null, fy: null, hy: null,
            spike: null, wall: null, food: null, windmill: null, utility: null, spawnpad: false
          };

          function yy() {
            const weapons = z.weapons || [], items = z.items || [];
            loadout.ee = null; loadout.ry = null; loadout.A = null; loadout.dy = null; loadout.ay = null;
            loadout.ly = null; loadout.cy = null; loadout.fy = null; loadout.hy = null; loadout.uy = null;
            for (const id of weapons) { if (id != null && id < 9) loadout.ee = id; else if (id != null) loadout.A = id; }
            for (const id of items) {
              if (id >= 0 && id <= 2) loadout.ry = id;
              else if (id >= 3 && id <= 5) loadout.ay = id;
              else if (id >= 6 && id <= 9) loadout.ly = id;
              else if (id >= 10 && id <= 12) loadout.cy = id;
              else if (id >= 13 && id <= 14) loadout.dy = id;
              else if (id >= 15 && id <= 16) loadout.uy = id;
              else if (id === 20) loadout.fy = id;
              else if (id >= 17 && id <= 22) loadout.hy = id;
            }
            loadout.spike = loadout.ly != null ? x.list[loadout.ly] : null;
            loadout.wall = loadout.ay != null ? x.list[loadout.ay] : null;
            loadout.food = loadout.ry != null ? x.list[loadout.ry] : null;
            loadout.windmill = loadout.cy != null ? x.list[loadout.cy] : null;
            loadout.utility = loadout.hy != null ? x.list[loadout.hy] : null;
            loadout.spawnpad = loadout.fy != null;
            return loadout;
          }

          function xy(t) {
            if (t.buildIndex == -1) {
              if (t.weaponIndex <= 8) {
                const sp = weaponSpeed(t.primary);
                if (sp) t.pr = j(1, t.pr + (t.delta > 190 ? t.delta : ce) / (sp * t.samRP));
              } else if (t.weaponIndex > 8) {
                const sp = weaponSpeed(t.secondary);
                if (sp) t.sr = j(1, t.sr + (t.delta > 190 ? t.delta : ce) / (sp * t.samRS));
              }
            }
            t.tr = j(1, t.tr + t.delta / 2400);
            rn[t.sid] = t.pr; an[t.sid] = t.sr; ln[t.sid] = t.tr;
            if (t.sid != z.sid) {
              if (!t.hasSoldier && t.skinIndex == 6) t.hasSoldier = true;
              if (!t.hasTank && t.skinIndex == 40) t.hasTank = true;
            }
          }

          function by() {
            for (let e = 0; e < J.length; e++) {
              const t = J[e];
              if (!t.visible && t.sid != z.sid) {
                const pSp = weaponSpeed(t?.primary);
                const sSp = weaponSpeed(t?.secondary);
                if (t.pr != undefined && t.pr !== 1 && pSp) t.pr = j(1, t.pr + ce / (pSp * t.samRP));
                if (t.sr != undefined && t.sr !== 1 && sSp) t.sr = j(1, t.sr + ce / (sSp * t.samRS));
                if (t.tr != undefined && t.tr !== 1) t.tr = j(1, t.tr + ce / 2500);
                rn[t.sid] = t.pr; an[t.sid] = t.sr; ln[t.sid] = t.tr;
              }
            }
          }

          function spawnFields(e) {
            Object.assign(e, {
              active: true, alive: true, lockMove: false, lockDir: false, minimapCounter: 0, chatCountdown: 0,
              shameCount: 0, shameTimer: 0, gathering: 0, autoGather: 0, animTime: 0, animSpeed: 0, mouseState: 0,
              buildIndex: -1, weaponIndex: 0, noMovTimer: 0, maxXP: 300, deathCount: 0, XP: 0, age: 1, kills: 0,
              upgrAge: 2, upgradePoints: 0, zIndex: 0, xVel: 0, yVel: 0, slowMult: 1, dir: 0, dirPlus: 0, targetDir: 0,
              targetAngle: 0, maxHealth: 100, health2: 0, samRP: 1, samRS: 1, pr: 1, sr: 1, hasSoldier: false,
              hasTank: false, scale: K.playerScale, speed: K.playerSpeed, shootCount: 0, timeSpentNearVolcano: 0
            });
            e.health = e.maxHealth;
            if (!e.weaponXP) e.weaponXP = [];
            e.dmgOverTime = {};
            e.reloads = {};
          }

          function onPlayerAdd(p) {
            const t = p.data, isYou = !!p.isYou;
            if (!Array.isArray(t)) return;
            let e = jg(t[0]);
            const fresh = !e;
            if (!e) {
              if (t[1] === z.sid || isYou) e = z;
              else {
                e = MooMoo.players.get(t[1]);
                if (!e) { e = { sid: t[1] }; MooMoo.players.set(t[1], e); }
              }
              if (J.indexOf(e) < 0) J.push(e);
              e.id = t[0];
              e.tmpScore = 0; e.team = e.team ?? null; e.skinIndex = e.skinIndex || 0; e.tailIndex = e.tailIndex || 0;
              e.hitTime = 0; e.points = e.points || 0; e.dt = 0; e.hidden = false; e.itemCounts = e.itemCounts || {};
              e.isPlayer = true; e.pps = 0; e.moveDir = undefined; e.skinRot = 0; e.lastPing = 0; e.iconIndex = 0;
              e.deaths = 0; e.skinColor = 0;
            }
            spawnFields(e);
            e.visible = false;
            e.x2 = undefined; e.y2 = undefined;
            e.id = t[0]; e.sid = t[1]; e.name = t[2]; e.x = t[3]; e.y = t[4]; e.dir = t[5]; e.bot = false;
            e.health = t[6]; e.maxHealth = t[7]; e.scale = t[8]; e.skinColor = t[9];
            e.__hp = t[6];
            e.rx = t[3]; e.ry = t[4]; e.rdir = t[5];
            e.pr = 1; e.sr = 1; e.tr = 1; e.hitProjs = 0; e.primary = undefined; e.secondary = undefined;
            e.shameCount = 0; e.primaryVar = 3; e.secondaryVar = 3; e.lastx = 0; e.tick = v; e.lasty = 0;
            e.aura = !!t[10]; e.bossMode = !!t[11]; e.clan = t[12] || null;
            if (isYou) { e.weapons = [0]; e.items = [0, 3, 6, 10]; }
            rn[t[1]] = 1; an[t[1]] = 1; e.pr = 1; e.sr = 1;
            !e.seenCount ? e.seenCount = 1 : e.seenCount++;
            e.primary = null; e.secondary = null;
            e.samRP = 1; e.didDeath = false; e.samRS = 1;
            e.noAntiList = e.noAntiList ?? new Array(10).fill(0);
            e.healArr = [];
            e.loadout = { spike: x.list[9], spawnpad: false, utility: undefined, windmill: undefined, trap: true, wall: x.list[3], food: x.list[0] };
            ln[t[1]] = 1;
            e.deathDmgs = []; e.dmgsNow = [];
            !e.trackLeak && (e.trackLeak = []);
            !e.trackGain && (e.trackGain = []);
            e.tr = 1; e.shameCount = 0; e.healTrack = []; e.Alive = true;
            if (isYou) e.loadout = loadout;
            runHooks(hooks.playerAdded, e, { fresh, isYou, seenCount: e.seenCount });
          }

          function onPlayerRemove(p) {
            const sid = p.sid;
            for (let i = Ln.length - 1; i >= 0; i--) if (Ln[i].owner.sid == sid) Ln.splice(i, 1);
            for (let e = 0; e < J.length; e++) {
              if (J[e].sid == sid && J[e] !== z) {
                const gone = J[e];
                J.splice(e, 1);
                runHooks(hooks.playerLeft, gone);
                break;
              }
            }
          }

          const SHAME_WINDOW = 120, SHAME_MARGIN = 8;
          let lastHitSeen = 0;
          function shameWait(now) {
            if (!lastHitSeen) return 0;
            const rtt = env.net && env.net.minPing ? env.net.minPing() : 0;
            return Math.max(0, lastHitSeen + SHAME_WINDOW + SHAME_MARGIN - rtt - (now != null ? now : Date.now()));
          }

          function onHealth(p) {
            const q = Hg(p.sid);
            if (!q) return;
            const n = Date.now();
            const prevHealth = q.__hp != null ? q.__hp : q.health;
            const i = p.value - prevHealth;
            if (q === z && i < 0) lastHitSeen = n;
            if (q.isPlayer && q.healArr) q.healArr.push([i, p.value, n]);
            q.lastHealth = prevHealth;
            q.animatedHealth = n;
            q.health = p.value;
            q.__hp = p.value;
          }

          function l5(e, t, n, i) {
            let r;
            const o = Hg(e);
            if (!o) return;
            if (o.health <= 0 && o.vis2 && !o.visible && !o.didDeath) { runHooks(hooks.framePlayer, o, "deathAnim"); o.deaths++; o.didDeath = true; }
            if (!z.healths) z.healths = [];
            if (o.sid == z.sid) {
              if (z.healths.length >= 8) z.healths.pop();
              z.healths.push({ hp: o.health, tick: v });
            }
            if (t == -5 * (o.skinIndex == 6 ? 0.75 : 1) && o.poison) o.lastBull = v - 1;
            if (o.health <= 0) { o.Alive = false; o.Alive2 = false; }
            if (t < 0) {
              if (o.sid != z.sid && o.dmgs == "XD") o.dmgs = 0;
              if (o.sid != z.sid) o.dmgs += S(t);
              if (o == z) z.lastDamage3 = i;
            }
            o.dmgsNow.unshift(H(t * 100) / 100);
            if (t > 0) {
              if (o.skinIndex == 13) {
                if (o.tailIndex == 13) { if (t == 6) o.lastBull = v - 1; if (z == o) et = 0; return; }
                else { if (t == 3) o.lastBull = v - 1; if (z == o) et = 0; return; }
              }
              if (!isNaN(o.shameCount) && o.lastDamage) {
                r = o.assumeAge >= 7 && o.loadout?.utility?.name == "cheese" && S(tn - i) <= 2 && t <= 10;
                if (i - o.lastDamage <= 120) {
                  o.healTime = i - o.lastDamage2;
                  if (o.shameCount >= 8 && o.assumeAge >= 7 && S(tn - i) <= 2 && t <= 10 && o.loadout.utility == undefined) {
                    o.loadout.utility = x.list[2];
                  }
                  if (!r) {
                    o.noAntiList = o.noAntiList.map((x2) => x2 * 0.95);
                    if (!o.shameUp) o.shameUp = [];
                    if (o.shameUp.length >= 5) o.shameUp.shift();
                    o.shameUp.push(o.healTime);
                    o.gainSpeed = o.shameUp.reduce((a, b) => a + b, 0) / o.shameUp.length;
                    o.prevShameUp = o.shameCount;
                    if (o.lowHealth <= 40) o.noAntiList[o.shameCount]--;
                    o.shameCount = j(8, o.shameCount + 1);
                  }
                } else if (!r) {
                  o.healTime = i - o.lastDamage2;
                  if (!o.shameDown) o.shameDown = [];
                  if (o.shameDown.length >= 5) o.shameDown.shift();
                  o.shameDown.push(o.healTime);
                  o.leakSpeed = o.shameDown.reduce((a, b) => a + b, 0) / o.shameDown.length;
                  o.prevShameDown = o.shameCount;
                  if (o.lowHealth <= 60) {
                    o.noAntiList[o.shameCount]++;
                    const tt = o.noAntiList.reduce((a, b) => a + (b > 0 ? b : 0), 0);
                    if (tt >= 3) {
                      const ix = o.noAntiList.indexOf(Math.max(...o.noAntiList));
                      if (o.noAntiList[ix] * 2 > tt) o.noAnti = ix;
                    }
                  }
                  o.shameCount = oe(0, o.shameCount - 2);
                }
                o.lastDamage = 0; o.lastDamage2 = 0; o.thisHealth = undefined;
              }
            } else {
              o.lowHealth = n;
              o.lastDamage = i;
              o.lastDamage2 = i;
              o.dmgDate = i;
              o.thisHealth = o.health;
              if (!te(o.sid) && Y?.inTrap) {
                const ee = Xt.filter((e2) => se(Y.inTrap, e2) <= 50 + e2.scale + 35 && ((te(e2?.owner?.sid) && e2?.group?.name == "spikes") || (Y && !Y.team && e2?.group?.name == "spikes" && e2?.owner?.sid != Y.sid) || (e2?.type == 1 && e2.y >= 12e3)));
                if (ee.length && t == -(ee[0]?.type != 1 ? ee[0]?.dmg : 35) * (o.skinIndex == 6 ? 0.75 : 1)) o.hitSpike = true;
              }
              if (o.sid === z.sid) {
                const ee = Xt.filter((e2) => se(z, e2) <= e2.scale + 35 && ((!te(e2?.owner?.sid) && e2?.group?.name == "spikes") || (e2?.type == 1 && e2.y >= 12e3)));
                if (ee.length && t == -(ee[0]?.type != 1 ? ee[0]?.dmg : 35) * (o.skinIndex == 6 ? 0.75 : 1)) o.hitSpike = ee[0];
              }
              if (o.skinIndex == 7) {
                if (o.tailIndex == 13) {
                  if (t == -2) { o.lastBull = v - 1; o.lastBull2 = Date.now(); o.bTT = 1e3; return; }
                } else if (t == -5) {
                  if (o == z) et = 0;
                  o.lastBull2 = Date.now(); o.bTT = 1e3; o.lastBull = v - 1;
                  return;
                }
              }
            }
          }

          function k2(e, n, t, i) {
            if (!i) return pn.push({ id: k2, data: [e, t, n, true] });
            const o = Hg(e);
            if (!o) return;
            n > 9 ? o.sr = 0 : o.pr = 0;
            o.slowMult -= weapon(n)?.hitSlow || 0.3;
            if (o.slowMult < 0) o.slowMult = 0;
            if (o.sid == z.sid) z.invisTime = 1e3;
            o.samRS = (o.skinIndex == 20 && n > 9) ? 0.78 : 1;
            o.samRP = (o.skinIndex == 20 && n < 9) ? 0.78 : 1;
            const r = J.concat(bh);
            for (let idx = 0; idx < r.length; idx++) {
              const e2 = r[idx];
              const tt = e2.sid != o.sid && se(o, e2, "player") <= weapon(n).range && (o.team && o.team != e2.team || !o.team) && getAngleDist(B(o, e2), o.d2) <= h;
              if (tt) {
                if (!e2.isAI && ((n >= 9 && (o.secondaryVar === 3 || o.skinIndex == 21)) || (n < 9 && (o.primaryVar === 3 || o.skinIndex == 21)))) {
                  e2.poison = 5;
                }
                if (o.skinIndex == 58 || o.skinIndex == 55 || o.tailIndex == 18) {
                  o.gatherHeal = { dmg: weapon(n).dmg, tick: v };
                }
              }
            }
          }

          async function onGather(p) {
            const a = p && p.args; if (!a) return;
            const e = a[0], t = a[1], n = a[2];
            let s = Hg(e);
            if (s) {
              s.lastSwing = { didHit: t, weaponIndex: n, at: Date.now() };
              k2(e, t, n, false);
              s.hitBuild = t;
            }
            await A4();
            if (t) {
              s = Hg(e);
              if (s) ft.slice().forEach((r) => r.attemptResolve(s, s.skinIndex, v));
            }
          }

          class O3 {
            constructor(e, t) {
              this.dir = e;
              this.building = t;
              this.building.players = [];
              this.settled = false;
              const selfRef = this;
              this.timer = setTimeout(() => {
                if (!selfRef.settled) {
                  selfRef.settled = true;
                  selfRef.remove();
                }
              }, 111);
            }
            resolve(dmg) {
              if (this.settled) return;
              this.settled = true;
              clearTimeout(this.timer);
              this.building.health -= dmg;
              this.remove();
            }
            remove() {
              const i = ft.indexOf(this);
              if (i >= 0) ft.splice(i, 1);
            }
            attemptResolve(s, o, r, e, t) {
              if (this.settled) return;
              if (e && this.building.sid == e.building.sid && r === this.building.tick) {
                this.resolve(this.building.projDmg ? e.dmg : 0);
              } else if (t && !e && r === this.building.tick) {
                this.resolve(200);
                runHooks(hooks.buildingDamage, this.building, 200, null);
              } else if (!e && this.building.owner != null && this.building.name != "mine" && this.building.name != "sapling") {
                const ang = P(this.building.y - s.y2, this.building.x - s.x2);
                const tt = B(s, this.building);
                const w = weapon(s.weaponIndex);
                if (w && (H(ang * 10) / 10 == this.dir || Ay(H(ang * 10) / 10, this.dir) <= 0.1005) && r == this.building.tick && se(s, this.building, "object") <= w.range && getAngleDist(tt, s.d2) <= h && !this.building.players.includes(s.sid)) {
                  const dmg = EN[s.weaponVariant] * (o == 40 ? 3.3 : 1) * w.dmg * (s.weaponIndex == 10 ? 7.5 : 1);
                  this.resolve(dmg);
                  this.building.players.push(s.sid);
                  runHooks(hooks.buildingDamage, this.building, dmg, s);
                }
              }
            }
          }

          async function onWiggle(p) {
            const a = p && p.args; if (!a) return;
            const e = a[0], t = a[1];
            await A4();
            const q = objects && objects.get(t);
            if (q) {
              q.tick = v;
              ft.push(new O3(e, q));
              q.lastHealth = q.health;
              q.animatedHealth = Date.now();
            }
          }

          function onTurretShoot(p) {
            const a = p && p.args; if (!a) return;
            const q = objects && objects.get(a[0]);
            if (q) { q.xWiggle += K.gatherWiggle * U(a[1] + W); q.yWiggle += K.gatherWiggle * V(a[1] + W); }
          }

          function onAnimals(p) {
            const args = (p && p.args) || [];
            const n = args[0] || [];
            const hidden = args[1] || [];
            bosses = { Xi: null, Ji: null, qi: null };
            for (let e = bh.length; e--;) { bh[e].forcePos = !bh[e].visible; bh[e].visible = false; }
            for (let e = 0, t = Date.now(); e < n.length; e += 8) {
              let q = Wg(n[e]);
              const dir = n[e + 4] / 100;
              if (q) {
                q.index = n[e + 1];
                q.t1 = q.t2 === undefined ? t : q.t2; q.t2 = t;
                q.x1 = q.x; q.y1 = q.y;
                q.x2 = n[e + 2]; q.y2 = n[e + 3];
                q.d1 = q.d2 === undefined ? dir : q.d2; q.d2 = dir;
                q.health = n[e + 5];
                q.dt = 0; q.visible = true;
              } else {
                const type = data.animal(n[e + 1]) || {};
                q = {
                  sid: n[e], index: n[e + 1], isAI: true, active: true, src: type.src, name: type.name || "",
                  scale: type.scale, maxHealth: type.health, killScore: type.killScore, hostile: !!type.hostile,
                  weightM: type.weightM || 1, spriteMlt: type.spriteMlt, nameScale: type.nameScale,
                  x: n[e + 2], y: n[e + 3], dir, startX: n[e + 2], startY: n[e + 3], xVel: 0, yVel: 0, zIndex: 0
                };
                bh.push(q);
                q.x2 = q.x; q.y2 = q.y; q.d2 = q.dir;
                q.health = n[e + 5];
                if (!type.name) q.name = ["Steph", "Bessie", "Wilfred", "Emily", "Hugo", "Sue", "Tim", "Zeus", "Mira", "Frank"][n[e + 6]] || q.name;
                q.forcePos = true; q.visible = true;
              }
              q.state = n[e + 7];
              if (q.index < 6) continue;
              if (q.name === "MOOSTAFA") bosses.Xi = q;
              else if (q.name === "MOOFIE") bosses.Ji = q;
              else if (q.name === "Treasure") bosses.qi = q;
            }
            for (const sid of hidden) { const q = Wg(sid); if (q) q.visible = false; }
          }

          async function onAnimalAttack(p) {
            const q = Wg(p && p.args && p.args[0]);
            if (q) {
              q.lastAttack = Date.now();
              await A4();
              ft.slice().forEach((r) => r.attemptResolve(1, 1, v, 0, q));
            }
          }

          function eg(t) {
            const n = Xt.filter((e) => e.name == "platform");
            for (let e = 0; e < n.length; e++) if (S4(n[e], t) <= 35 + n[e].scale) return 1;
            return 0;
          }

          function v4(t, n) {
            const e = objects && objects._list.find((o) => o.name == "turret" && o.x == t && o.y == n);
            if (e) { e.time = 2200; e.NOW = false; e.shot = Date.now(); return e; }
            return false;
          }

          function tg(i, s, o, e, t, n, r, a, l, c) {
            if (!r && !a && !l) return pn.push({ id: tg, data: [i, s, o, e, t, n, false, true] });
            if (n == 1) {
              const tur = v4(i, s);
              if (l && tur) return tur;
              if (tur) return;
            }
            let f = null;
            const hp = P3(i, s, o + W, 70);
            for (let k = 0; k < J.length; k++) {
              c = J[k];
              if (t == 1.5 && n == 1) {
                if (c.visible && c.skinIndex == 53 && se({ x: i, y: s }, c) <= 2) { f = c; break; }
              } else if (c.visible && c?.weaponIndex == c?.secondary && c.d2 === o && weapon(c.weaponIndex)?.projectile == n && S4(hp, c) <= 20) {
                f = c; break;
              }
            }
            if (l) return f;
            if (f) {
              Ln.push({
                x: f.x2, y: f.y2, dir: o, spd: t * (f.skinIndex === 1 ? 1.3 : 1),
                avoid: t == 1.5 || eg(f) ? 1 : 0, max: x.projectiles[n].range, dmg: x.projectiles[n].dmg,
                traveled: 0, owner: f, building: null, hit: null, info: x.projectiles[n]
              });
              const vol = ng.find((g) => g.player.sid === f.sid);
              if (!vol) ng.push({ player: f, projs: [n], amt: 1, tick: v });
              else { if (!vol.projs.includes(n)) vol.amt++; vol.projs.push(n); vol.tick = v; }
            }
            let turretGearShot = false;
            if (t == 1.5 && n == 1 && f) {
              if (rn[f.sid] === 1 && !te(f.sid) && se(f, z) <= 300 && (f.primary === 5 && f.primaryVar >= 2 || f.primary === undefined)) turretGearShot = true;
              f.tr = 0;
            }
            if (t != 1.5 && n != 1 && f) { f.samRS = f.skinIndex == 20 ? 0.78 : 1; f.sr = 0; }
            runHooks(hooks.projectile, { x: i, y: s, dir: o, range: e, speed: t, index: n, owner: f, turretGearShot, volley: f ? ng.find((g) => g.player?.sid == f.sid) : null });
          }

          function onProjectileAdd(p) {
            const a = p && p.args; if (!a) return;
            tg(a[0], a[1], a[2], a[3], a[4], a[5]);
          }

          function stepProjectiles(onFutureHit) {
            const nAnimals = bh.filter((e) => e.visible);
            for (let c = 0; c < Ln.length; c++) {
              let s = Infinity, o2 = Infinity;
              const rr = [];
              const a = Ln[c];
              const owner = Hg(a.owner.sid);
              if (!owner) { Ln.splice(c, 1); continue; }
              const e = J.filter((e2) => e2.visible && !(typeof owner.team == "string" && e2.team == owner.team) && e2.sid != owner.sid);
              const l = Xt.filter((e2) => !e2.ignoreCollision && e2.elevation > a.avoid).concat(nAnimals, e);
              for (let i = 0; i < l.length; i++) {
                const q = l[i];
                const sc = q.realScale ? q.realScale : q.scale;
                const dd = S4(a, q);
                rr[0] = lineInRect((q.x2 || q.x) - sc, (q.y2 || q.y) - sc, (q.x2 || q.x) + sc, (q.y2 || q.y) + sc, a.owner.x2, a.owner.y2, a.x + a.spd * ce * U(a.dir), a.y + a.spd * ce * V(a.dir));
                rr[1] = lineInRect((q.x2 || q.x) - sc, (q.y2 || q.y) - sc, (q.x2 || q.x) + sc, (q.y2 || q.y) + sc, a.owner.x2, a.owner.y2, a.x + a.spd * u * U(a.dir), a.y + a.spd * u * V(a.dir));
                if (rr[0] && dd < s) { s = dd; Ln[c].hit = q; Ln[c].building = q.realScale ? q : null; }
                if (rr[1] && dd < o2) { o2 = dd; Ln[c].futureHit = q; }
              }
              if (Ln[c].futureHit && !Ln[c].hit && Ln[c].futureHit.isPlayer) {
                const fh = Hg(Ln[c].futureHit.sid);
                if (fh) fh.hitProjs += Ln[c].dmg;
                if (onFutureHit) onFutureHit(Ln[c]);
              }
              Ln[c].x += a.spd * ce * U(a.dir);
              Ln[c].y += a.spd * ce * V(a.dir);
              Ln[c].traveled += a.spd * ce;
              if (Ln[c].hit && onFutureHit) onFutureHit(Ln[c], true);
            }
            Ln.forEach((t) => {
              if (t.building) setTimeout(() => { ft.slice().forEach((r) => r.attemptResolve(1, 1, v, t)); }, 10);
            });
            for (let i = Ln.length - 1; i >= 0; i--) {
              const e = Ln[i];
              if (e.hit || e.traveled >= e.max) Ln.splice(i, 1);
            }
          }

          function lineInRect(recX, recY, recX2, recY2, x1, y1, x2, y2) {
            let minX = x1, maxX = x2;
            if (x1 > x2) { minX = x2; maxX = x1; }
            if (maxX > recX2) maxX = recX2;
            if (minX < recX) minX = recX;
            if (minX > maxX) return false;
            let minY = y1, maxY = y2;
            const dx = x2 - x1;
            if (Math.abs(dx) > 0.0000001) {
              const a = (y2 - y1) / dx, b = y1 - a * x1;
              minY = a * minX + b; maxY = a * maxX + b;
            }
            if (minY > maxY) { const tmp = maxY; maxY = minY; minY = tmp; }
            if (maxY > recY2) maxY = recY2;
            if (minY < recY) minY = recY;
            return minY <= maxY;
          }

          const lastRes = Object.create(null);
          async function onPlayerValue(p) {
            const e = p.key, t = p.value;
            if (["food", "stone", "wood"].includes(String(e))) {
              const prevV = lastRes[e] != null ? lastRes[e] : 0;
              lastRes[e] = t;
              const s = t - prevV;
              await A4();
              if (s > 0) {
                if (!z.weaponXP) z.weaponXP = [];
                if (!z.weaponXP[z.weaponIndex]) z.weaponXP[z.weaponIndex] = 0;
                z.weaponXP[z.weaponIndex] += s;
              }
            }
          }

          function onObjectsLoad(p) {
            const e = (p && p.args && p.args[0]) || [];
            for (let n = 0; n + 7 < e.length; n += 8) {
              const t = Hg(e[n + 7]);
              if (e[n + 7] !== null && t != null && L3(z, t)) b4(t.loadout, e[n + 6]);
            }
          }
          function onItemCount(p) {
            const a = p && p.args; if (!a) return;
            if (!z.itemCounts) z.itemCounts = {};
            z.itemCounts[a[0]] = a[1];
          }
          function onInventory(p) {
            if (p.isWeapon) z.weapons = p.list || [];
            else z.items = p.list || [];
            yy();
          }
          function onTribeMembers(p) {
            const a = p && p.args; if (!a) return;
            py = Array.isArray(a[0]) ? a[0].slice() : [];
          }
          function onTribeSet(p) {
            const a = p && p.args;
            if (a && (a[0] == null || a[0] === "")) py = [];
          }

          let sandbox = !!env.sandbox;
          function hasRes(t, n) {
            for (let e = 0; e < t.req.length; e += 2) {
              if ((z[t.req[e]] || 0) < H(t.req[e + 1] * (n || 1))) return false;
            }
            return true;
          }
          function canBuild(e) {
            if (!e) return false;
            const t = sandbox ? e.group.sandboxLimit || oe(e.group.limit * 3, 99) : e.group.limit;
            return t && (z.itemCounts || {})[e.group.id] >= t ? false : sandbox ? true : hasRes(e);
          }
          z.canBuild = canBuild;
          z.hasRes = hasRes;

          let lastFrame = 0, rafId = null;
          function interpolate(now) {
            const mh = lastFrame ? now - lastFrame : 16;
            lastFrame = now;
            const xT = Date.now() - ce;
            const list = J.concat(bh);
            for (let s = 0; s < list.length; s++) {
              const q = list[s];
              if (!q || !q.visible || q.x2 == null) continue;
              if (q.forcePos) { q.x = q.x2; q.y = q.y2; q.dir = q.d2; q.rx = q.x; q.ry = q.y; q.rdir = q.dir; continue; }
              const rr = q.t2 - q.t1, a = rr > 0 ? (xT - q.t1) / rr : 0, l = 170;
              q.dt = (q.dt || 0) + mh;
              const c = j(1.7, q.dt / l);
              if (q.x1 == null) { q.x1 = q.x2; q.y1 = q.y2; }
              q.x = q.x1 + (q.x2 - q.x1) * c; q.y = q.y1 + (q.y2 - q.y1) * c;
              q.lastx = q.x; q.lasty = q.y;
              if (q.d1 != null && q.d2 != null && rr > 0) q.dir = lerpAngle(q.d2, q.d1, j(1.2, a));
              q.rx = q.x; q.ry = q.y; q.rdir = q.dir;
            }
          }

          function frameLoop() {
            if (!win || typeof win.requestAnimationFrame !== "function") return;
            const step = () => {
              try { interpolate(Date.now()); } catch (_) {}
              rafId = win.requestAnimationFrame(step);
            };
            rafId = win.requestAnimationFrame(step);
          }

          const state = {
            Nt: false,
            ns: [], is: [], ss: [],
            spikeTrap: null
          };

          async function updatePlayers(payload) {
            runHooks(hooks.preTick, payload);
            tn = Date.now();
            v++;
            runHooks(hooks.tickStart, payload);
            state.ss.length = state.ns.length = state.is.length = vn.length = Sn.length = 0;
            vn = []; Sn = [];
            for (let e = J.length; e--;) {
              const q = J[e];
              q.vis2 = !!q.visible;
              q.forcePos = !q.visible;
              q.visible = false;
            }
            const positions = (payload && payload.positions) || [];
            const t = Date.now();
            for (const pos of positions) {
              const q = Hg(pos.sid);
              if (!q) continue;
              q.t1 = void 0 === q.t2 ? t : q.t2; Xe[q.sid] = q; q.t2 = t;
              q.x1 = q.rx != null ? q.rx : q.x; q.y1 = q.ry != null ? q.ry : q.y;
              q.preX = q.x2; q.preY = q.y2;
              q.pmovDir = q.movDir;
              q.x2 = pos.x; q.y2 = pos.y;
              q.d1 = void 0 === q.d2 ? pos.dir : q.d2; q.d2 = pos.dir;
              q.delta = q.dt; q.dt = 0;
              if (q.delta == null || isNaN(q.delta)) q.delta = ce;
              const isSelf = q === z;
              q.buildIndex = isSelf ? z.buildIndex : q.buildIndex;
              q.weaponIndex = isSelf ? z.weaponIndex : q.weaponIndex;
              q.weaponVariant = isSelf ? (z.weaponVariant || 0) : (q.variant || 0);
              q.isLeader = !!q.isLeader;
              q.skinIndex = isSelf ? (z.hat || 0) : (q.skin || 0);
              if (q.skinIndex != 45) { q.shameTimer = 30; q.clowned = false; }
              if (q.skinIndex == 45 && q.shameTimer == 30) x5(q);
              q.tailIndex = isSelf ? (z.accessory || 0) : (q.tail || 0);
              q.iconIndex = q.icon != null ? q.icon : q.iconIndex;
              q.visible = true;
              if (q.x1 == null || isNaN(q.x1)) { q.x1 = q.x2; q.y1 = q.y2; }
              if (q.preX == null) { q.preX = q.x2; q.preY = q.y2; }
              q.xVel = q.x2 - q.preX; q.xVel2 = q.x2 - q.x1;
              q.yVel = q.y2 - q.preY; q.yVel2 = q.y2 - q.y1;
              q.slowMult = oe(1, (q.slowMult || 1) + 8e-4 * ce);
              q.movSpd = D((q.preY - q.y2) ** 2 + (q.preX - q.x2) ** 2);
              q.movSpd2 = D((q.y1 - q.y2) ** 2 + (q.x1 - q.x2) ** 2);
              q.movDir = P(q.y2 - q.preY, q.x2 - q.preX);
              if ((q.movDir == 0 && q.movSpd == 0) || (q.preX == q.x2 && q.preY == q.y2)) q.movDir = undefined;
              q.weaponIndex >= 9 ? q.secondary = q.weaponIndex : q.primary = q.weaponIndex;
              if (q.weaponIndex == q.primary) q.primaryVar = q.weaponVariant;
              if (q.weaponIndex == q.secondary) q.secondaryVar = q.weaponVariant;
              q.lastpr = q.pr; q.lastsr = q.sr; q.lasttr = q.tr;
              q.tick = v;
              xy(q);
              q.weaponE = q.weaponIndex == q.secondary ? q.sr : q.pr;
              q.multpr = q.lastpr == q.pr && q.pr == 0 ? (q.multpr = 0.015, q.lastpr = 0.015) : q.pr;
              q.multsr = q.lastsr == q.sr && q.sr == 0 ? (q.multsr = 0.015, q.lastsr = 0.015) : q.sr;
              q.hitProjs = 0; q.hitSpike = false;
              q.np = l4(q);
              q.inWater = q.y2 >= K.mapScale / 2 - K.riverWidth / 2 && q.y2 <= K.mapScale / 2 + K.riverWidth / 2;
              if (q.buildIndex != -1 && q.loadout) b4(q.loadout, q.buildIndex);
              q.assumeAge = g4(q);
              q.x = q.x1; q.y = q.y1; q.dir = q.rdir != null ? q.rdir : q.d2;
              if (te(q.sid)) Sn.push(q); else vn.push(q);
            }
            yy();
            runHooks(hooks.postReconstruct, payload);
            await sleep(1);
            if (objects) {
              const list = objects._list;
              Xt = list.filter((e) => (e.distance = X5(e.x - z.x2, e.y - z.y2)) <= 2e3);
              Q = Xt.filter((e) => e.distance <= 800);
            }
            runHooks(hooks.afterSleep, payload);
            const ve = Ve; Ve = [];
            ve.forEach((e) => e());
            const pq = pn; pn = [];
            pq.forEach((e) => e.id(...e.data));
            runHooks(hooks.deferredFlushed, payload);
            for (let e = J.length; e--;) {
              const i = J[e];
              if (!i) continue;
              if (i.visible) i.weaponR = i.weaponIndex == i.secondary ? i.sr : i.pr;
              if (isNaN(i.poison)) i.poison = 0;
              if (i.poison > 0) i.poison = oe(0, i.poison - (i.delta || ce) / 1e3);
              if (!i?.Alive2 && !i?.Alive) { runHooks(hooks.framePlayer, i, "died"); i.deaths++; }
              i.Alive2 = true;
              runHooks(hooks.framePlayer, i, "damage");
              i.dmgs = "XD";
              if (i.vis2 == false && i.visible && i.buildIndex == -1) {
                if (i.weaponIndex != i?.primary && i.primaryVar <= 2) i.primaryVar = 3;
                else if (i.weaponIndex != i?.secondary && i.secondaryVar <= 2 && (i.secondary == 10 || i.secondary == 14)) i.secondaryVar = 3;
              }
              if (i.healArr && i.healArr.length) { i.healArr.forEach((h2) => l5(i.sid, h2[0], h2[1], h2[2])); i.healArr = []; }
              if (!i.deathDmgs) i.deathDmgs = [];
              if (!i.dmgsNow) i.dmgsNow = [];
              if (i.dmgsNow.length) i.deathDmgs.push(i.dmgsNow);
              i.dmgsNow = [];
              if (i.health === 100) i.deathDmgs = [];
              i.bleed = i.lastBull ? ((v - i.lastBull + (i.sid === z.sid ? et : 0)) % 9 + 9) % 9 : undefined;
            }
            runHooks(hooks.afterPlayers, payload);
            for (let e = vn.length; e--;) vn[e].distance = D((vn[e].x2 - z.x2) ** 2 + (vn[e].y2 - z.y2) ** 2);
            vn = vn.sort((a, b) => a.distance - b.distance);
            Y = vn[0] || null;
            xi.player = J.find((e) => e.sid === xi.ID && e.visible) || null;
            if (xi.player) xi.player.positions = a4(xi.player, 6);
            else if (Y) { xi.player = Y; xi.player.positions = a4(xi.player, 6); }
            if (objects) objects.update(z.delta);
            runHooks(hooks.frame, payload);
            by();
            runHooks(hooks.frameLate, payload);
          }

          async function x5(e, t = Hg(e.sid)) {
            if (e.shameTimer <= 0 || e.skinIndex != 45 || !t) return;
            t.shameCount = 0;
            t.clowned = true;
            t.shameTimer -= e.delta / 1e3;
            await A4();
            x5(t);
          }

          function onSetup(p) {
            en = true;
            z.sid = p.sid;
            try { if (win && win.config && "inSandbox" in win.config) sandbox = !!win.config.inSandbox; } catch (_) {}
          }
          function onDied() {
            en = false;
            runHooks(hooks.died);
          }

          MooMoo.on("setup", onSetup);
          MooMoo.on("playerAdd", onPlayerAdd);
          MooMoo.on("playerRemove", onPlayerRemove);
          MooMoo.on("playersUpdate", (p) => { updatePlayers(p).catch((e) => console.error("[moomoo.js] tick threw", e)); });
          MooMoo.on("gatherAnimation", (p) => { onGather(p); });
          MooMoo.on("health", onHealth);
          MooMoo.on("wiggle", (p) => { onWiggle(p); });
          MooMoo.on("turretShoot", onTurretShoot);
          MooMoo.on("animalsUpdate", onAnimals);
          MooMoo.on("animalAttack", (p) => { onAnimalAttack(p); });
          MooMoo.on("projectileAdd", onProjectileAdd);
          MooMoo.on("playerValue", (p) => { onPlayerValue(p); });
          MooMoo.on("itemCount", onItemCount);
          MooMoo.on("objectsLoad", onObjectsLoad);
          MooMoo.on("inventory", onInventory);
          MooMoo.on("tribeMembers", onTribeMembers);
          MooMoo.on("tribeSet", onTribeSet);
          MooMoo.on("died", onDied);
          frameLoop();

          function hookAdder(name) { return (fn) => { hooks[name].add(fn); return () => hooks[name].delete(fn); }; }

          function _y(e, t) {
            if (!e) return;
            !t && (t = 111);
            return j(1, e.weaponR + t / weapon(e.weaponIndex)?.speed);
          }
          function Vy(e, t, n, i) {
            return se(e, t, "player") <= n || (i && se(e?.np?.real, t?.np?.real, "player") <= n);
          }
          function o4(e, t, n) {
            if (t.weaponIndex != 11) return true;
            n = B(e, t);
            return getAngleDist(n + W, t.dir) > W / 3;
          }

          return {
            get z() { return z; }, get self() { return z; },
            get tick() { return v; }, get v() { return v; },
            get et() { return et; }, set et(n) { et = n; },
            get tn() { return tn; }, get en() { return en; }, set en(b) { en = b; },
            get target() { return Y; }, set target(t) { Y = t; },
            get Y() { return Y; }, set Y(t) { Y = t; },
            xi,
            get visibleEnemies() { return vn; }, get vn() { return vn; }, set vn(a) { vn = a; },
            get visibleFriends() { return Sn; }, get Sn() { return Sn; },
            get players() { return J; }, get J() { return J; },
            get animals() { return bh; }, get bh() { return bh; }, get bosses() { return bosses; },
            get projectiles() { return Ln; }, get Ln() { return Ln; },
            get volleys() { return ng; }, set volleys(a) { ng = a; }, get ng() { return ng; }, set ng(a) { ng = a; },
            get ft() { return ft; },
            get Xt() { return Xt; }, get Q() { return Q; },
            get py() { return py; },
            get loadout() { return loadout; },
            rn, an, ln, Xe, state,
            get sandbox() { return sandbox; }, set sandbox(b) { sandbox = !!b; },
            selfInput,
            shameWait, get lastHitSeen() { return lastHitSeen; },
            A4, nextTick: A4, defer: (fn, ...args) => pn.push({ id: fn, data: args }),
            se, B, S4, Dy, P3, L3, X5, Ne, Ay, angleDist: getAngleDist, getDirection, getDistance, lerpAngle, lineInRect,
            _y, Vy, o4, l4, a4, x4, w4, b4, g4, xy, l5, te, Hg, jg, Wg, yy, canBuild, hasRes,
            stepProjectiles,
            variantVal, weaponSpeed, weaponRange,
            visiblePlayers: () => J.filter((p) => p !== z && p.visible),
            K, ce, u, EN, h, O3,
            onPreTick: hookAdder("preTick"),
            onTickStart: hookAdder("tickStart"),
            onPostReconstruct: hookAdder("postReconstruct"),
            onAfterSleep: hookAdder("afterSleep"),
            onDeferredFlushed: hookAdder("deferredFlushed"),
            onAfterPlayers: hookAdder("afterPlayers"),
            onFrame: hookAdder("frame"),
            onFrameLate: hookAdder("frameLate"),
            onFramePlayer: hookAdder("framePlayer"),
            onProjectile: hookAdder("projectile"),
            onPlayerAdded: hookAdder("playerAdded"),
            onPlayerLeft: hookAdder("playerLeft"),
            onBuildingDamage: hookAdder("buildingDamage"),
            onDied: hookAdder("died"),
            _updatePlayers: updatePlayers, _interpolate: interpolate,
            get _pn() { return pn; }, get _Ve() { return Ve; }
          };
        }

        return { createCombat, K, ce, EN, r3 };
      });

      /* ===== module: game/render (loader/src/game/render.js) ===== */
      (function (root, factory) {
        const value = factory();
        if (typeof module === "object" && module.exports) module.exports = value;
        if (typeof root !== "undefined") root.MooMooRender = value;
        if (typeof globalThis !== "undefined") globalThis.MooMooRender = value;
      })(typeof self !== "undefined" ? self : this, function () {
        "use strict";

        const TAU = Math.PI * 2;

        function lerpAngle(from, to, amount) {
          if (Math.abs(to - from) > Math.PI) {
            if (from > to) to += TAU; else from += TAU;
          }
          const out = to + (from - to) * amount;
          return out >= 0 && out <= TAU ? out : out % TAU;
        }

        function createRender(env) {
          const win = env.win;
          const MooMoo = env.MooMoo;
          const cfg = env.config || {};
          const MAX_W = cfg.maxScreenWidth || 1920;
          const MAX_H = cfg.maxScreenHeight || 1080;
          const MAP = cfg.mapScale || 14400;
          const TICK_MS = 1000 / (cfg.serverUpdateRate || 9);
          const report = env.onError || ((e) => { try { console.error("[moomoo.js] render", e); } catch (_) {} });
          const doc = (win && win.document && typeof win.document.createElement === "function") ? win.document : null;

          const players = new Map();
          const animals = new Map();
          let me = null;
          const camera = { x: MAP / 2, y: MAP / 2 };
          let camOverride = null;

          MooMoo.on("playerAdd", (pk) => {
            const d = pk && pk.data;
            if (!Array.isArray(d)) return;
            let p = players.get(d[1]);
            if (!p) { p = { sid: d[1] }; players.set(d[1], p); }
            p.id = d[0];
            p.name = d[2];
            p.visible = false;
            p.x2 = undefined; p.y2 = undefined;
            p.x = d[3]; p.y = d[4]; p.dir = d[5];
            p.scale = d[8];
            p.dt = 0;
            if (pk.isYou) { me = p; camera.x = p.x; camera.y = p.y; }
          });

          MooMoo.on("playerRemove", (pk) => {
            const id = pk && pk.sid;
            for (const [sid, p] of players) {
              if (p.id === id || sid === id) { players.delete(sid); if (p === me) me = null; break; }
            }
          });

          MooMoo.on("playersUpdate", (pk) => {
            for (const pos of pk.positions) {
              const p = players.get(pos.sid);
              if (!p) continue;
              p.forcePos = !p.visible;
              p.x1 = p.x; p.y1 = p.y;
              p.settle = p.x2 == pos.x && p.y2 == pos.y;
              p.x2 = pos.x; p.y2 = pos.y;
              p.d2 = pos.dir;
              p.d1 = p.forcePos || p.dir === undefined ? p.d2 : p.dir;
              p.dt = 0;
              p.visible = true;
            }
            for (const sid of pk.hidden) { const p = players.get(sid); if (p) p.visible = false; }
          });

          MooMoo.on("animalsUpdate", (pk) => {
            const a = pk && pk.args;
            const list = a && a[0], gone = a && a[1];
            const now = Date.now();
            for (let o = 0; list && o < list.length; o += 8) {
              let p = animals.get(list[o]);
              if (p && p.index != list[o + 1]) { animals.delete(list[o]); p = null; }
              if (p) {
                p.forcePos = !p.visible;
                p.x1 = p.x; p.y1 = p.y;
                p.settle = p.x2 == list[o + 2] && p.y2 == list[o + 3];
                p.x2 = list[o + 2]; p.y2 = list[o + 3];
                p.d2 = list[o + 4] / 100;
                p.d1 = p.forcePos || p.dir === undefined ? p.d2 : p.dir;
                p.health = list[o + 5];
                if ((list[o + 7] || 0) != p.state) p.stateAt = now;
                p.state = list[o + 7] || 0;
                p.dt = 0;
                p.visible = true;
              } else {
                p = { sid: list[o], index: list[o + 1], x: list[o + 2], y: list[o + 3], dir: list[o + 4] / 100 };
                p.x2 = p.x; p.y2 = p.y; p.d2 = p.dir;
                p.health = list[o + 5];
                p.state = list[o + 7] || 0; p.stateAt = now;
                p.forcePos = true; p.visible = true; p.dt = 0;
                animals.set(p.sid, p);
              }
            }
            for (let o = 0; gone && o < gone.length; ++o) { const p = animals.get(gone[o]); if (p) p.visible = false; }
          });

          let lastNow = Date.now();
          let lockCache = false, lockReadAt = 0;
          function cameraLock() {
            const now = Date.now();
            if (now - lockReadAt > 500) {
              lockReadAt = now;
              try { lockCache = win.localStorage && win.localStorage.getItem("camera_lock") === "true"; } catch (_) { lockCache = false; }
            }
            return lockCache;
          }

          function interpolate(p, delta) {
            if (!p.visible) return;
            if (p.forcePos) { p.x = p.x2; p.y = p.y2; p.dir = p.d2; return; }
            p.dt += delta;
            const r = Math.min(p.settle ? 1 : 1.7, p.dt / 170);
            p.x = p.x1 + (p.x2 - p.x1) * r;
            p.y = p.y1 + (p.y2 - p.y1) * r;
            p.dir = lerpAngle(p.d2, p.d1, Math.min(1, p.dt / TICK_MS));
          }

          const view = { left: 0, top: 0, width: MAX_W, height: MAX_H, scale: 1, dpr: 1, camX: camera.x, camY: camera.y, delta: 16, now: lastNow, inGame: false };

          function step() {
            const now = Date.now();
            const delta = Math.max(0, now - lastNow);
            lastNow = now;
            const follow = camOverride || me;
            if (follow) {
              const dist = Math.hypot(follow.x - camera.x, follow.y - camera.y);
              const dir = Math.atan2(follow.y - camera.y, follow.x - camera.x);
              const move = Math.min(dist * 0.01 * delta, dist);
              if (dist > 0.05) { camera.x += move * Math.cos(dir); camera.y += move * Math.sin(dir); }
              else { camera.x = follow.x; camera.y = follow.y; }
            } else { camera.x = MAP / 2; camera.y = MAP / 2; }
            for (const p of players.values()) interpolate(p, delta);
            for (const p of animals.values()) interpolate(p, delta);
            if (!camOverride && cameraLock() && me && MooMoo.self && MooMoo.self.alive) {
              camera.x = me.x; camera.y = me.y;
            }
            const w = win.innerWidth || MAX_W, h = win.innerHeight || MAX_H;
            const scale = Math.max(w / MAX_W, h / (MAX_H * 1.15), Math.sqrt(w * h / (MAX_W * MAX_H)));
            view.scale = scale;
            view.width = w / scale; view.height = h / scale;
            view.camX = camera.x; view.camY = camera.y;
            view.left = camera.x - view.width / 2;
            view.top = camera.y - view.height / 2;
            view.dpr = win.devicePixelRatio || 1;
            view.delta = delta; view.now = now;
            view.inGame = !!me;
          }

          const layers = [];
          const frameHooks = new Set();
          let replacer = null;
          let layerCanvas = null, layerG = null, frameCanvas = null, frameG = null;
          let stockHidden = false;

          function mount() {
            if (layerCanvas) return true;
            if (!doc || !doc.body) return false;
            const game = doc.getElementById("gameCanvas");
            if (!game || !game.parentNode) return false;
            const after = doc.getElementById("textCanvas") || game;
            const make = () => {
              const c = doc.createElement("canvas");
              c.style.position = "absolute";
              c.style.left = "0px";
              c.style.top = "0px";
              c.style.pointerEvents = "none";
              c.style.display = "none";
              return c;
            };
            frameCanvas = make();
            layerCanvas = make();
            after.parentNode.insertBefore(frameCanvas, after.nextSibling);
            frameCanvas.parentNode.insertBefore(layerCanvas, frameCanvas.nextSibling);
            frameG = frameCanvas.getContext("2d");
            layerG = layerCanvas.getContext("2d");
            return true;
          }

          function setStockHidden(hide) {
            if (!doc || stockHidden === hide) return;
            stockHidden = hide;
            for (const id of ["gameCanvas", "textCanvas"]) {
              const c = doc.getElementById(id);
              if (c) c.style.visibility = hide ? "hidden" : "";
            }
          }

          function clearFrameCanvas() {
            if (!frameG) return;
            frameG.setTransform(1, 0, 0, 1, 0, 0);
            frameG.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
          }

          let raf = null, dead = false;
          function frame() {
            if (dead) return;
            raf = win.requestAnimationFrame(frame);
            step();
            for (const fn of Array.from(frameHooks)) { try { fn(view); } catch (e) { report(e); } }
            if (!mount()) return;

            if (replacer && view.inGame) {
              layerCanvas.style.display = "none";
              try {
                const drew = replacer.draw({ canvas: frameCanvas, g: frameG, view, delta: view.delta, now: view.now });
                if (drew === false) {
                  frameCanvas.style.display = "none";
                  setStockHidden(false);
                } else {
                  frameCanvas.style.display = "block";
                  setStockHidden(true);
                }
              } catch (e) {
                clearFrameCanvas();
                frameCanvas.style.display = "none";
                setStockHidden(false);
                if (!replacer.errLogged) { replacer.errLogged = true; report(e); }
              }
              return;
            }

            frameCanvas.style.display = "none";
            setStockHidden(false);

            if (!layers.length || !view.inGame) { layerCanvas.style.display = "none"; return; }
            const W = Math.max(1, Math.round((win.innerWidth || MAX_W) * view.dpr));
            const H = Math.max(1, Math.round((win.innerHeight || MAX_H) * view.dpr));
            if (layerCanvas.width !== W || layerCanvas.height !== H) {
              layerCanvas.width = W; layerCanvas.height = H;
              layerCanvas.style.width = (win.innerWidth || MAX_W) + "px";
              layerCanvas.style.height = (win.innerHeight || MAX_H) + "px";
            }
            layerCanvas.style.display = "block";
            layerG.setTransform(1, 0, 0, 1, 0, 0);
            layerG.clearRect(0, 0, W, H);
            const s = view.scale * view.dpr;
            for (const L of layers) {
              layerG.save();
              layerG.setTransform(s, 0, 0, s, 0, 0);
              try { L.draw(layerG, view); }
              catch (e) { if (!L.failed) { L.failed = true; report(e); } }
              layerG.restore();
            }
          }

          if (doc && typeof win.requestAnimationFrame === "function") raf = win.requestAnimationFrame(frame);

          function addLayer(id, draw, opts) {
            const L = { id: String(id), z: (opts && opts.z) || 0, draw, failed: false };
            layers.push(L);
            layers.sort((a, b) => a.z - b.z);
            return () => { const i = layers.indexOf(L); if (i >= 0) layers.splice(i, 1); };
          }

          function setReplacer(spec) {
            const R = { draw: spec.draw, errLogged: false };
            replacer = R;
            return () => {
              if (replacer !== R) return;
              replacer = null;
              clearFrameCanvas();
              if (frameCanvas) frameCanvas.style.display = "none";
              setStockHidden(false);
            };
          }

          return {
            view, camera, players, animals, lerpAngle,
            player: (sid) => players.get(sid),
            animal: (sid) => animals.get(sid),
            get me() { return me; },
            addLayer, setReplacer,
            setCameraOverride: (pt) => { camOverride = (pt && typeof pt.x === "number" && typeof pt.y === "number") ? { x: pt.x, y: pt.y } : null; return camOverride; },
            get cameraOverride() { return camOverride; },
            onFrame: (fn) => { frameHooks.add(fn); return () => frameHooks.delete(fn); },
            worldToScreen: (x, y) => ({ x: (x - view.left) * view.scale, y: (y - view.top) * view.scale }),
            get replacing() { return !!replacer; },
            get layerCanvas() { return layerCanvas; },
            get frameCanvas() { return frameCanvas; },
            _step: step,
            uninstall() {
              dead = true;
              if (raf != null && win.cancelAnimationFrame) win.cancelAnimationFrame(raf);
              setStockHidden(false);
              try { layerCanvas && layerCanvas.remove(); frameCanvas && frameCanvas.remove(); } catch (_) {}
            }
          };
        }

        return { createRender, lerpAngle };
      });

      /* ===== module: game/pathfind (loader/src/game/pathfind.js) ===== */
      (function (root, factory) {
        const value = factory();
        if (typeof module === "object" && module.exports) module.exports = value;
        if (typeof root !== "undefined") root.MooMooPathfind = value;
        if (typeof globalThis !== "undefined") globalThis.MooMooPathfind = value;
      })(typeof self !== "undefined" ? self : this, function () {
        "use strict";

        function makeSearch() {
          const sqrt = Math.sqrt, abs = Math.abs, floor = Math.floor, MAX = Number.MAX_VALUE;
          const SQRT2 = sqrt(2);
          const SPAN = 900;
          const CELL = 12;
          const HALF = CELL / 2;
          const N = Math.round(SPAN / CELL);
          const TOTAL = N * N;
          const STEPS = [
            [0, -1, CELL], [0, 1, CELL], [-1, 0, CELL], [1, 0, CELL],
            [1, 1, CELL * SQRT2], [1, -1, CELL * SQRT2], [-1, 1, CELL * SQRT2], [-1, -1, CELL * SQRT2]
          ];
          const dist = (x1, y1, x2, y2) => sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

          function blocking(b, me, clan) {
            b.scale2 = (b.owner == null || b.name == "sapling") && b.type === 0 ? b.scale * 0.7
              : b.dmg && !clan.includes(b?.owner?.sid) && b?.owner?.sid != me.sid ? b.scale + 40
              : b.type === 1 && b.y < 12e3 && (b.teleport || b.boostSpeed) ? b.scale + 35
              : b["do"] ? b.scale : b.scale - 10;
            return (b.ignoreCollision
              ? (b.name === "pit trap"
                ? (b?.owner?.sid != me.sid && !clan.includes(b.owner?.sid))
                : (b.name === "boost pad" || b.name === "teleporter"))
              : true) && dist(b.x, b.y, me.x2, me.y2) < SPAN;
          }

          function buildGrid(sx, sy, obstacles, tx, ty) {
            const xs = new Float32Array(TOTAL);
            const ys = new Float32Array(TOTAL);
            const obs = new Uint8Array(TOTAL);
            let bestIdx = 0, bestDist = MAX;

            for (let y = 0; y < N; y++) {
              const py = sy - SPAN / 2 + y * CELL + HALF;
              const rowOff = y * N;
              for (let x = 0; x < N; x++) {
                const idx = rowOff + x;
                const px = sx - SPAN / 2 + x * CELL + HALF;
                xs[idx] = px;
                ys[idx] = py;
                const d = dist(px, py, tx, ty);
                if (d < bestDist) { bestDist = d; bestIdx = idx; }
              }
            }

            for (let i = 0; i < obstacles.length; i++) {
              const o = obstacles[i];
              const rad = (o.scale2 || 0) + 35;
              const radSq = rad * rad;
              for (let idx = 0; idx < TOTAL; idx++) {
                if (obs[idx]) continue;
                const dx = xs[idx] - o.x;
                const dy = ys[idx] - o.y;
                if (dx * dx + dy * dy <= radSq) obs[idx] = 1;
              }
            }
            return { xs, ys, obs, bestIdx, bestDist };
          }

          function findPath(sx, sy, tx, ty, obstacles) {
            const { xs, ys, obs, bestIdx, bestDist } = buildGrid(sx, sy, obstacles, tx, ty);
            const gScore = new Float32Array(TOTAL);
            const fScore = new Float32Array(TOTAL);
            const cameFrom = new Int32Array(TOTAL);
            const closed = new Uint8Array(TOTAL);
            gScore.fill(MAX);
            fScore.fill(MAX);
            cameFrom.fill(-1);

            const startX = floor((sx - (sx - SPAN / 2)) / CELL);
            const startY = floor((sy - (sy - SPAN / 2)) / CELL);
            const goalX = floor((tx - (sx - SPAN / 2)) / CELL);
            const goalY = floor((ty - (sy - SPAN / 2)) / CELL);
            if (startX < 0 || startY < 0 || startX >= N || startY >= N) return [];

            const startIdx = startY * N + startX;
            const goalIdx = (goalX >= 0 && goalY >= 0 && goalX < N && goalY < N) ? (goalY * N + goalX) : bestIdx;

            gScore[startIdx] = 0;
            fScore[startIdx] = dist(xs[startIdx], ys[startIdx], xs[goalIdx], ys[goalIdx]);
            const open = [startIdx];

            let closestIdx = startIdx;
            let closestH = dist(xs[startIdx], ys[startIdx], tx, ty);

            while (open.length > 0) {
              let bestPos = 0;
              for (let i = 1; i < open.length; i++) {
                if (fScore[open[i]] < fScore[open[bestPos]]) bestPos = i;
              }
              const current = open[bestPos];
              open.splice(bestPos, 1);

              const curX = current % N;
              const curY = (current - curX) / N;

              if (curX === goalX && curY === goalY) {
                const path = [];
                let c = current;
                while (c !== -1) {
                  path.push([xs[c], ys[c]]);
                  c = cameFrom[c];
                }
                path.reverse();
                return path;
              }

              closed[current] = 1;
              const hToTarget = dist(xs[current], ys[current], tx, ty);
              if (hToTarget < closestH) { closestH = hToTarget; closestIdx = current; }

              for (let s = 0; s < STEPS.length; s++) {
                const nx = curX + STEPS[s][0];
                const ny = curY + STEPS[s][1];
                if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
                const nIdx = ny * N + nx;
                if (closed[nIdx] || obs[nIdx]) continue;
                const tenG = gScore[current] + STEPS[s][2];
                if (tenG < gScore[nIdx]) {
                  cameFrom[nIdx] = current;
                  gScore[nIdx] = tenG;
                  fScore[nIdx] = tenG + dist(xs[nIdx], ys[nIdx], xs[goalIdx], ys[goalIdx]);
                  if (open.indexOf(nIdx) === -1) open.push(nIdx);
                }
              }
            }

            if (closestIdx === startIdx && bestDist >= MAX) return [];
            const partial = [];
            let c = closestIdx;
            while (c !== -1) {
              partial.push([xs[c], ys[c]]);
              c = cameFrom[c];
            }
            partial.reverse();
            return partial;
          }

          function nextStep(sx, sy, path) {
            if (!Array.isArray(path) || path.length === 0) return null;
            for (let i = 0; i < path.length; i++) {
              if (dist(sx, sy, path[i][0], path[i][1]) > 15) {
                return { x: path[i][0], y: path[i][1], index: i };
              }
            }
            return { x: path[path.length - 1][0], y: path[path.length - 1][1], index: path.length - 1 };
          }

          return { blocking, findPath, nextStep };
        }

        function workerBody() {
          const search = makeSearch();
          self.onmessage = function (e) {
            const d = e.data || {};
            const path = search.findPath(d.sx, d.sy, d.tx, d.ty, d.obstacles || []);
            self.postMessage({ id: d.id, path });
          };
        }

        function createPathfinder(env) {
          const combat = env.combat;
          const search = makeSearch();
          let nextId = 1;
          const pending = new Map();
          let worker = null;
          let dead = false;

          const win = typeof window !== "undefined" ? window : null;
          const WorkerCtor = win && win.Worker;
          const BlobCtor = win && win.Blob;
          const URLObj = win && win.URL;

          if (WorkerCtor && BlobCtor && URLObj && typeof URLObj.createObjectURL === "function") {
            try {
              const code = "(" + workerBody.toString() + ")()";
              const blob = new BlobCtor([code], { type: "application/javascript" });
              const url = URLObj.createObjectURL(blob);
              worker = new WorkerCtor(url);
              worker.onmessage = function (ev) {
                const m = ev.data || {};
                const p = pending.get(m.id);
                if (!p) return;
                pending.delete(m.id);
                clearTimeout(p.timer);
                p.resolve(m.path || []);
              };
              worker.onerror = function () {
                worker = null;
                for (const [, p] of pending) {
                  clearTimeout(p.timer);
                  p.resolve(search.findPath(p.sx, p.sy, p.tx, p.ty, p.obstacles));
                }
                pending.clear();
              };
            } catch (_) {
              worker = null;
            }
          }

          function collectObstacles(me, clan) {
            const out = [];
            const list = combat.Xt || [];
            for (let i = 0; i < list.length; i++) {
              const o = list[i];
              if (!o) continue;
              const copy = { x: o.x, y: o.y, scale: o.scale, type: o.type, name: o.name, owner: o.owner, ignoreCollision: o.ignoreCollision, dmg: o.dmg, teleport: o.teleport, boostSpeed: o.boostSpeed, do: o["do"] };
              if (search.blocking(copy, me, clan)) out.push(copy);
            }
            return out;
          }

          function find(tx, ty, opts) {
            if (dead) return Promise.resolve([]);
            const me = combat.z;
            const sx = (opts && opts.sx != null) ? opts.sx : (me.x2 != null ? me.x2 : me.x);
            const sy = (opts && opts.sy != null) ? opts.sy : (me.y2 != null ? me.y2 : me.y);
            const clan = (opts && opts.clan) || combat.py || [];
            const obstacles = (opts && opts.obstacles) || collectObstacles(me, clan);
            const timeoutMs = (opts && opts.timeoutMs) || 350;

            if (!worker) {
              return Promise.resolve(search.findPath(sx, sy, tx, ty, obstacles));
            }
            const id = nextId++;
            return new Promise((resolve) => {
              const timer = setTimeout(() => {
                pending.delete(id);
                resolve(search.findPath(sx, sy, tx, ty, obstacles));
              }, timeoutMs);
              pending.set(id, { resolve, timer, sx, sy, tx, ty, obstacles });
              worker.postMessage({ id, sx, sy, tx, ty, obstacles });
            });
          }

          function findSync(tx, ty, opts) {
            const me = combat.z;
            const sx = (opts && opts.sx != null) ? opts.sx : (me.x2 != null ? me.x2 : me.x);
            const sy = (opts && opts.sy != null) ? opts.sy : (me.y2 != null ? me.y2 : me.y);
            const clan = (opts && opts.clan) || combat.py || [];
            const obstacles = (opts && opts.obstacles) || collectObstacles(me, clan);
            return search.findPath(sx, sy, tx, ty, obstacles);
          }

          return {
            find, findSync,
            nextStep: search.nextStep,
            blocking: search.blocking,
            destroy() {
              dead = true;
              for (const [, p] of pending) {
                clearTimeout(p.timer);
                p.resolve([]);
              }
              pending.clear();
              if (worker) { try { worker.terminate(); } catch (_) {} worker = null; }
            }
          };
        }

        return { createPathfinder, makeSearch };
      });

      /* ===== module: ui/notice (loader/src/ui/notice.js) ===== */
      (function (root, factory) {
        const value = factory();
        if (typeof module === "object" && module.exports) module.exports = value;
        if (typeof root !== "undefined") root.MooMooNotice = value;
        if (typeof globalThis !== "undefined") globalThis.MooMooNotice = value;
      })(typeof self !== "undefined" ? self : this, function () {
        "use strict";

        const LINKS = {
          discord: "",
          repo: ""
        };
        const STORAGE_KEY = "moomoojs:notice:v1";
        const VERSION = "1.3.4";

        function createNotice(env) {
          const doc = env.doc;
          const version = env.version || VERSION;
          const onReady = env.onReady || ((fn) => fn());
          const ls = () => { try { return env.win && env.win.localStorage; } catch (_) { return null; } };

          function seen() {
            const s = ls(); if (!s) return false;
            try { return s.getItem(STORAGE_KEY) === version; } catch (_) { return false; }
          }
          function markSeen() {
            const s = ls(); if (!s) return;
            try { s.setItem(STORAGE_KEY, version); } catch (_) {}
          }

          let host = null;
          function remove() { if (host && host.parentNode) host.parentNode.removeChild(host); host = null; }

          function openUrl(url) {
            if (!url || typeof url !== "string") return;
            const win = env.win || (typeof window !== "undefined" ? window : null);
            try { if (win && typeof win.open === "function") win.open(url, "_blank", "noopener,noreferrer"); } catch (_) {}
          }

          function showThanks(panel, onDone) {
            panel.innerHTML = "";
            const h = doc.createElement("h2");
            h.textContent = "Thanks for reading.";
            const p = doc.createElement("p");
            p.textContent = "Enjoy the game, and keep your mods clean.";
            const row = doc.createElement("div");
            row.className = "mmn-row";
            if (LINKS.discord) {
              const dc = doc.createElement("button");
              dc.className = "mmn-btn mmn-ghost";
              dc.textContent = "Discord";
              dc.onclick = () => openUrl(LINKS.discord);
              row.appendChild(dc);
            }
            const ok = doc.createElement("button");
            ok.className = "mmn-btn mmn-primary";
            ok.textContent = "Back to game";
            ok.onclick = onDone;
            row.appendChild(ok);
            panel.appendChild(h); panel.appendChild(p); panel.appendChild(row);
          }

          function render(force) {
            if (!force && seen()) return;
            if (!doc || !doc.body || host) return;

            host = doc.createElement("div");
            host.className = "mmn-backdrop";
            const shadow = host.attachShadow({ mode: "open" });

            const style = doc.createElement("style");
            style.textContent = `
              .mmn-backdrop { position: fixed; inset: 0; z-index: 2147483647; background: rgba(10, 12, 16, .72); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #e8ecf2; }
              .mmn-card { width: min(440px, calc(100vw - 32px)); background: #151921; border: 1px solid rgba(255, 255, 255, .12); border-radius: 12px; padding: 22px 24px; box-shadow: 0 24px 64px rgba(0, 0, 0, .55); }
              h2 { margin: 0 0 8px; font-size: 18px; font-weight: 600; }
              p { margin: 0 0 12px; color: #b6c0cf; }
              ul { margin: 0 0 18px; padding-left: 18px; color: #cfd7e3; }
              li { margin: 5px 0; }
              code { background: rgba(255, 255, 255, .08); padding: 1px 5px; border-radius: 4px; font-size: 12.5px; }
              .mmn-row { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; flex-wrap: wrap; }
              .mmn-btn { border: 0; border-radius: 8px; padding: 9px 16px; font: inherit; font-weight: 500; cursor: pointer; }
              .mmn-primary { background: #5b8cff; color: #fff; }
              .mmn-primary:hover { background: #497bf5; }
              .mmn-ghost { background: rgba(255, 255, 255, .08); color: #e8ecf2; }
              .mmn-ghost:hover { background: rgba(255, 255, 255, .14); }
            `;

            const card = doc.createElement("div");
            card.className = "mmn-card";

            const h = doc.createElement("h2");
            h.textContent = "moomoo.js v" + version;
            const p = doc.createElement("p");
            p.textContent = "A lightweight mod loader for MooMoo.io. A few quick notes:";
            const ul = doc.createElement("ul");
            [
              ["Fair play — ", "don't use it to ruin the game for others or bypass server rules."],
              ["Your mods, your risk — ", "only run scripts you trust; mods run on the page with your session."],
              ["Open menu — ", "press ", ["Right Shift"], " in game to toggle mods and settings."]
            ].forEach((parts) => {
              const li = doc.createElement("li");
              parts.forEach((part) => {
                if (Array.isArray(part)) { const k = doc.createElement("code"); k.textContent = part[0]; li.appendChild(k); }
                else li.appendChild(doc.createTextNode(part));
              });
              ul.appendChild(li);
            });

            const row = doc.createElement("div");
            row.className = "mmn-row";

            if (LINKS.discord) {
              const dc = doc.createElement("button");
              dc.className = "mmn-btn mmn-ghost";
              dc.textContent = "Discord";
              dc.onclick = () => openUrl(LINKS.discord);
              row.appendChild(dc);
            }
            if (LINKS.repo) {
              const gh = doc.createElement("button");
              gh.className = "mmn-btn mmn-ghost";
              gh.textContent = "GitHub";
              gh.onclick = () => openUrl(LINKS.repo);
              row.appendChild(gh);
            }

            const ok = doc.createElement("button");
            ok.className = "mmn-btn mmn-primary";
            ok.textContent = "Got it";
            ok.onclick = () => {
              markSeen();
              showThanks(card, remove);
            };
            row.appendChild(ok);

            card.appendChild(h); card.appendChild(p); card.appendChild(ul); card.appendChild(row);
            shadow.appendChild(style); shadow.appendChild(card);
            doc.body.appendChild(host);
          }

          onReady(() => { setTimeout(() => render(false), 600); });

          return { open: () => render(true), close: remove, seen };
        }

        return { createNotice, VERSION, LINKS };
      });

      /* ===== module: api (loader/src/api.js) ===== */
      (function (root, factory) {
        const deps = (typeof require === "function")
          ? {
              gamedata: require("../../shared/gamedata.js"),
              combatMod: require("./game/combat.js"),
              renderMod: require("./game/render.js"),
              pathfindMod: require("./game/pathfind.js"),
              storeMod: require("./game/store.js"),
              objectsMod: require("./game/objects.js")
            }
          : {
              gamedata: root.MooMooGameData,
              combatMod: root.MooMooCombat,
              renderMod: root.MooMooRender,
              pathfindMod: root.MooMooPathfind,
              storeMod: root.MooMooStore,
              objectsMod: root.MooMooObjects
            };
        const value = factory(deps);
        if (typeof module === "object" && module.exports) module.exports = value;
        if (typeof root !== "undefined") root.MooMooApi = value;
        if (typeof globalThis !== "undefined") globalThis.MooMooApi = value;
      })(typeof self !== "undefined" ? self : this, function (deps) {
        "use strict";

        const data = deps.gamedata;
        const { createCombat, K } = deps.combatMod;
        const { createRender, lerpAngle } = deps.renderMod;
        const { createPathfinder } = deps.pathfindMod;
        const { createStore } = deps.storeMod;
        const { createObjectManager } = deps.objectsMod;
        const WEAPON_VARIANT = [1, 1.1, 1.18, 1.18, 1.18];

        function createApi(env) {
          const MooMoo = env.MooMoo;
          const win = env.win || (typeof window !== "undefined" ? window : null);

          const selfInput = { moveDir: null, aimDir: 0 };
          let moveDir = null, aimDir = 0;

          const wrapMove = (fn) => function (dir) {
            const d = (dir && typeof dir === "object") ? dir.dir : dir;
            moveDir = (d === undefined || d === null) ? null : d;
            selfInput.moveDir = moveDir;
            return fn.apply(this, arguments);
          };
          const wrapStop = (fn) => function () {
            moveDir = null;
            selfInput.moveDir = null;
            return fn.apply(this, arguments);
          };
          const wrapAim = (fn) => function (dir) {
            const d = (dir && typeof dir === "object") ? dir.dir : dir;
            if (typeof d === "number" && !Number.isNaN(d)) { aimDir = d; selfInput.aimDir = d; }
            return fn.apply(this, arguments);
          };
          if (MooMoo.send) {
            if (MooMoo.send.move) MooMoo.send.move = wrapMove(MooMoo.send.move);
            if (MooMoo.send.stopMove) MooMoo.send.stopMove = wrapStop(MooMoo.send.stopMove);
            if (MooMoo.send.aim) MooMoo.send.aim = wrapAim(MooMoo.send.aim);
          }
          MooMoo.onSent((action, payload) => {
            if (action === "move") {
              const d = payload && payload.dir;
              moveDir = (d === undefined || d === null) ? null : d;
              selfInput.moveDir = moveDir;
            } else if (action === "stopMove") {
              moveDir = null;
              selfInput.moveDir = null;
            } else if (action === "aim") {
              const d = payload && payload.dir;
              if (typeof d === "number" && !Number.isNaN(d)) { aimDir = d; selfInput.aimDir = d; }
            }
          });

          const objects = createObjectManager({ MooMoo, data });
          const combat = createCombat({ MooMoo, data, objects, selfInput, win, net: env.net });
          const render = createRender({ win, MooMoo, config: K, onError: env.onError });
          const pathfind = createPathfinder({ combat });
          const store = createStore({ MooMoo, data });

          const posOf = (e) => (e && e.x2 != null ? { x: e.x2, y: e.y2 } : { x: e.x, y: e.y });
          const dist = (a, b) => {
            const pa = posOf(a), pb = posOf(b);
            return Math.hypot((pb.x || 0) - (pa.x || 0), (pb.y || 0) - (pa.y || 0));
          };
          const angle = (a, b) => {
            const pa = posOf(a), pb = posOf(b);
            return Math.atan2((pb.y || 0) - (pa.y || 0), (pb.x || 0) - (pa.x || 0));
          };
          const me = () => {
            const s = MooMoo.self;
            return combat.Hg(s.sid) || s;
          };

          const enemies = () => combat.visiblePlayers().filter((p) => !combat.te(p.sid));
          const friends = () => combat.visiblePlayers().filter((p) => combat.te(p.sid));
          const nearestEnemy = (maxRange) => {
            const m = me();
            let best = null, bestD = maxRange != null ? maxRange : Infinity;
            for (const p of enemies()) {
              const d = dist(m, p);
              if (d <= bestD) { bestD = d; best = p; }
            }
            return best;
          };

          const myWeapons = () => {
            const list = MooMoo.self.weapons || [];
            const out = { primary: null, secondary: null, all: [] };
            for (const id of list) {
              const w = data.weapon(id);
              if (!w) continue;
              out.all.push(w);
              if (w.type === 0 && !out.primary) out.primary = w;
              if (w.type === 1 && !out.secondary) out.secondary = w;
            }
            return out;
          };
          const myItems = () => (MooMoo.self.items || []).map((id) => data.item(id)).filter(Boolean);
          const itemInGroup = (groupName) => myItems().find((it) => it.group && it.group.name === groupName) || null;
          const foodItem = () => itemInGroup("food");

          const equipWeapon = (wOrId) => {
            const id = typeof wOrId === "object" && wOrId ? wOrId.id : wOrId;
            if (id == null) return false;
            MooMoo.send.selectItem(id, true);
            return true;
          };
          const equipItem = (itOrId) => {
            const id = typeof itOrId === "object" && itOrId ? itOrId.id : itOrId;
            if (id == null) return false;
            MooMoo.send.selectItem(id, false);
            return true;
          };
          const unequipItem = () => {
            const w = myWeapons().primary;
            MooMoo.send.selectItem(w ? w.id : 0, true);
          };

          const swing = (dir, opts) => {
            const o = opts || {};
            if (o.weapon != null) equipWeapon(o.weapon);
            if (dir != null) MooMoo.send.aim(dir);
            MooMoo.send.mouse(true, dir);
            MooMoo.send.mouse(false, dir);
          };

          const place = (itemOrId, dir, opts) => {
            const o = opts || {};
            const it = typeof itemOrId === "object" ? itemOrId : data.item(itemOrId);
            if (!it) return false;
            const prevW = MooMoo.self.weaponIndex;
            const d = dir != null ? dir : aimDir;
            equipItem(it.id);
            MooMoo.send.aim(d);
            MooMoo.send.mouse(true, d);
            MooMoo.send.mouse(false, d);
            if (o.restoreWeapon !== false) {
              MooMoo.send.selectItem(prevW != null ? prevW : 0, true);
            }
            return true;
          };

          const eat = (dir) => {
            const f = foodItem();
            if (!f) return false;
            return place(f, dir != null ? dir : aimDir, { restoreWeapon: true });
          };

          const hitDamage = (attacker, target, opts) => {
            const o = opts || {};
            const w = o.weapon ? (typeof o.weapon === "object" ? o.weapon : data.weapon(o.weapon)) : data.weapon(attacker.weaponIndex);
            if (!w) return 0;
            const vMult = WEAPON_VARIANT[(attacker.weaponVariant != null ? attacker.weaponVariant : attacker.variant) || 0] || 1;
            let dmg = (w.dmg || 0) * vMult;
            const hat = attacker.skinIndex ? data.hat(attacker.skinIndex) : null;
            const acc = attacker.tailIndex ? data.accessory(attacker.tailIndex) : null;
            if (hat && hat.dmgMultO) dmg *= hat.dmgMultO;
            if (acc && acc.dmgMultO) dmg *= acc.dmgMultO;
            if (o.crit) dmg *= 1.5;
            if (target) {
              const tHat = target.skinIndex ? data.hat(target.skinIndex) : null;
              const tAcc = target.tailIndex ? data.accessory(target.tailIndex) : null;
              if (tHat && tHat.dmgMult) dmg *= tHat.dmgMult;
              if (tAcc && tAcc.dmgMult) dmg *= tAcc.dmgMult;
              if (target.weaponIndex === 11 && !combat.o4(attacker, target)) dmg *= (1 - 0.8);
            }
            return dmg;
          };

          const reloadProgress = (player, slot) => {
            const p = player || me();
            if (!p) return 1;
            if (slot === "secondary" || slot === 1) return p.sr != null ? p.sr : 1;
            if (slot === "turret") return p.tr != null ? p.tr : 1;
            return p.pr != null ? p.pr : 1;
          };

          const isReloaded = (player, slot) => reloadProgress(player, slot) >= 0.99;

          const walkTo = (x, y, opts) => {
            const o = opts || {};
            const m = me();
            const d = Math.hypot(x - (m.x2 != null ? m.x2 : m.x), y - (m.y2 != null ? m.y2 : m.y));
            if (d <= (o.stopWithin != null ? o.stopWithin : 4)) {
              MooMoo.send.stopMove();
              return { arrived: true, distance: d };
            }
            const dir = Math.atan2(y - (m.y2 != null ? m.y2 : m.y), x - (m.x2 != null ? m.x2 : m.x));
            MooMoo.send.move(dir);
            return { arrived: false, distance: d, dir };
          };

          const stopWalk = () => MooMoo.send.stopMove();
          const walkPath = (path, opts) => {
            const m = me();
            const sx = m.x2 != null ? m.x2 : m.x;
            const sy = m.y2 != null ? m.y2 : m.y;
            const step = pathfind.nextStep(sx, sy, path);
            if (!step) { MooMoo.send.stopMove(); return null; }
            return Object.assign(walkTo(step.x, step.y, opts), { step });
          };

          const addHud = (id, draw, opts) => render.addLayer(id, draw, opts);
          const worldToScreen = (x, y) => render.worldToScreen(x, y);
          const replaceCanvas = (spec) => render.setReplacer(spec);
          const setCamera = (pt) => render.setCameraOverride(pt);
          const onRender = (fn) => render.onFrame(fn);
          const onTick = (fn) => combat.onFrame(fn);

          const onKey = (k, fn, opts) => env.input ? env.input.onKey(k, fn, opts) : () => {};
          const isKeyDown = (k) => env.input ? env.input.isDown(k) : false;
          const aimAngle = () => env.input ? env.input.aimAngle() : aimDir;
          const pointer = () => (env.input ? { x: env.input.mouse.x, y: env.input.mouse.y } : { x: 0, y: 0 });

          const api = {
            data, combat, render, pathfind, store, objects,
            me, enemies, friends, nearestEnemy, dist, angle, lerpAngle,
            myWeapons, myItems, itemInGroup, foodItem,
            equipWeapon, equipItem, unequipItem, swing, place, eat,
            hitDamage, reloadProgress, isReloaded,
            walkTo, stopWalk, walkPath,
            addHud, worldToScreen, replaceCanvas, setCamera, onRender, onTick,
            onKey, isKeyDown, aimAngle, pointer,
            get moveDir() { return moveDir; },
            get aimDir() { return aimDir; },
            set moveDir(d) { moveDir = d; selfInput.moveDir = d; MooMoo.send.move(d); },
            set aimDir(d) { aimDir = d; selfInput.aimDir = d; MooMoo.send.aim(d); }
          };

          MooMoo.api = api;
          MooMoo._setCtxExtensions((ctx) => {
            ctx.api = api;
            ctx.data = data;
            ctx.combat = combat;
            ctx.render = render;
            ctx.pathfind = pathfind;
            ctx.store = store;
            ctx.objects = objects;
          });
          return api;
        }

        return { createApi };
      });

      /* ===== module: loader (loader/src/loader.js) ===== */
      (function () {
        "use strict";

        const VERSION = "1.3.4";
        const LOG_PREFIX = "%c[moomoo.js]";
        const LOG_STYLE = "color:#7cc;font-weight:bold";

        const root = (typeof window !== "undefined") ? window : globalThis;
        const doc = (typeof document !== "undefined") ? document : null;
        const protocol = (typeof require === "function") ? require("./net/protocol.js") : root.MooMooProtocol;
        const msgpack = (typeof require === "function") ? require("./net/msgpack.js") : root.MooMooMsgpack;
        const binding = (typeof require === "function") ? require("./net/binding.js") : root.MooMooBinding;
        const { installWebSocketProxy } = (typeof require === "function") ? require("./net/socket.js") : root.MooMooSocket;
        const { createRuntime } = (typeof require === "function") ? require("./core/runtime.js") : root.MooMooRuntime;
        const { createOutgoing } = (typeof require === "function") ? require("./net/outgoing.js") : root.MooMooOutgoing;
        const { installInput } = (typeof require === "function") ? require("./game/input.js") : root.MooMooInput;
        const { createApi } = (typeof require === "function") ? require("./api.js") : root.MooMooApi;
        const { createNotice } = (typeof require === "function") ? require("./ui/notice.js") : root.MooMooNotice;

        const { SEAL_OFF, SEAL_REPORT, SEAL_BIND, sealValue, sha256, bytesHash } = protocol;
        const { telemetry } = binding;

        const SEAL_KEY = "moomoojs:seal:v1";
        const BUNDLE_KEY = "moomoojs:bundle:v1";
        const BUNDLE_MAGIC = 0x4d4d4231;

        function lsGet(k) { try { return root.localStorage && root.localStorage.getItem(k); } catch (_) { return null; } }
        function lsSet(k, v) { try { root.localStorage && root.localStorage.setItem(k, v); } catch (_) {} }
        function bytesToHex(b) { let s = ""; for (let i = 0; i < b.length; i++) s += (b[i] < 16 ? "0" : "") + b[i].toString(16); return s; }
        function hexToBytes(h) {
          if (!h || h.length % 2) return null;
          const out = new Uint8Array(h.length / 2);
          for (let i = 0; i < out.length; i++) {
            const v = parseInt(h.substr(i * 2, 2), 16);
            if (Number.isNaN(v)) return null;
            out[i] = v;
          }
          return out;
        }
        function randomSeal() {
          const out = new Uint8Array(32);
          if (root.crypto && typeof root.crypto.getRandomValues === "function") {
            root.crypto.getRandomValues(out);
            return out;
          }
          for (let i = 0; i < 32; i++) out[i] = (Math.random() * 256) | 0;
          return out;
        }
        function readBundleDigest(obj) {
          if (!obj || typeof obj !== "object") return null;
          const b = obj.bundleBytes;
          if (!b) return null;
          const arr = (b instanceof Uint8Array) ? b : Array.isArray(b) ? new Uint8Array(b) : null;
          if (!arr || arr.length < 12) return null;
          const dv = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
          if (dv.getUint32(0, false) !== BUNDLE_MAGIC) return null;
          const len = dv.getUint32(8, false);
          if (len <= 0 || 12 + len > arr.length) return null;
          return sha256(arr.subarray(12, 12 + len));
        }

        const storedSealHex = lsGet(SEAL_KEY);
        const storedSeal = hexToBytes(storedSealHex);
        const rawSeal = storedSeal || randomSeal();
        if (!storedSeal) lsSet(SEAL_KEY, bytesToHex(rawSeal));

        function currentBundleDigest() {
          const snap = root.__MML_SNAPSHOT__;
          if (snap) {
            const d = readBundleDigest(snap);
            if (d) return d;
          }
          const raw = lsGet(BUNDLE_KEY);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed && typeof parsed.bytes === "string") {
                const b = hexToBytes(parsed.bytes);
                if (b) {
                  const d = readBundleDigest({ bundleBytes: b });
                  if (d) return d;
                }
              }
            } catch (_) {}
          }
          return null;
        }

        function currentSeal() {
          const digest = currentBundleDigest();
          return digest ? sealValue(rawSeal, digest) : rawSeal;
        }

        const outgoing = createOutgoing({ rateLimits: binding.rateLimits });
        let activeSocket = null;
        let activeSession = null;
        let activeProto = null;
        let probeSalt = 0;
        let lastSentSeq = 0;
        let lastSentLedger = 0;

        const det = { flags: 0, untrusted: 0, probeResult: 0 };
        const telemetryCtx = () => ({ sealReport: activeSession && activeSession.sealReport, probeSalt, seq: lastSentSeq, ledger: lastSentLedger });

        function isSocketOpen(ws) { return Boolean(ws && ws.readyState === 1); }

        function buildC2SFrame(actionName, payload) {
          const spec = binding.outgoing[actionName];
          if (!spec) throw new Error("unknown action: " + actionName);
          const args = spec.build(payload || {});
          return { wire: spec.wire, args };
        }

        function sendWire(wire, args, source) {
          const info = { source: source || "mod", wire };
          let actionName = null, filteredPayload = null;
          const parsed = binding.outgoingParse[wire];
          if (parsed) {
            actionName = parsed.action;
            filteredPayload = MooMoo._filterOutgoing(actionName, parsed.parse(args || []), info);
            if (!filteredPayload) return false;
            args = binding.outgoing[actionName].build(filteredPayload);
          }
          if (!outgoing.allow(wire)) return false;
          if (!isSocketOpen(activeSocket) || !activeSession) return false;
          if (wire === "0") outgoing.onPingSent();
          const frame = activeSession.encodeC2S(wire, args || []);
          lastSentSeq = activeSession.lastSeq;
          lastSentLedger = activeSession.ledger;
          try {
            wsHook.nativeSend(activeSocket, frame);
            outgoing.record(wire);
            if (actionName) MooMoo._notifySent(actionName, filteredPayload, info.source);
            return true;
          } catch (e) {
            console.error(LOG_PREFIX, LOG_STYLE, "send failed", e);
            return false;
          }
        }

        function sendAction(actionName, payload) {
          const { wire, args } = buildC2SFrame(actionName, payload);
          return sendWire(wire, args, "mod");
        }

        function sendRaw(wire, args) { return sendWire(wire, args || [], "raw"); }

        const MooMoo = createRuntime({
          version: VERSION,
          logPrefix: LOG_PREFIX,
          logStyle: LOG_STYLE,
          loaderInfo: { version: VERSION, protocol: "moomoo-v2" },
          sink: { sendAction, sendRaw }
        });

        const input = doc ? installInput(root) : null;
        const netHandle = {
          get socket() { return activeSocket; },
          get session() { return activeSession; },
          get connected() { return isSocketOpen(activeSocket) && Boolean(activeSession); },
          outgoing,
          send: sendRaw,
          protocol,
          msgpack,
          binding
        };
        MooMoo.net = netHandle;

        const api = createApi({
          MooMoo,
          win: root,
          input,
          net: netHandle,
          onError: (e) => { try { console.error(LOG_PREFIX, LOG_STYLE, e); } catch (_) {} }
        });

        if (doc) {
          createNotice({
            doc,
            win: root,
            version: VERSION,
            onReady: (fn) => MooMoo.onReady(fn)
          });
        }

        function handleIncomingFrame(data) {
          if (!activeSession) return;
          let bytes;
          if (data instanceof ArrayBuffer) bytes = new Uint8Array(data);
          else if (ArrayBuffer.isView(data)) bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
          else return;

          let decoded;
          try { decoded = activeSession.decodeS2C(bytes); } catch (_) { return; }
          if (!decoded || !decoded.name) return;

          if (decoded.name === "0") { outgoing.onPong(); }

          const spec = binding.incoming[decoded.name];
          if (!spec) return;
          const payload = spec.parse(decoded.args);

          if (spec.event === "probes") {
            probeSalt = (payload && payload.salt) >>> 0;
            const probes = (payload && payload.probes) || [];
            if (activeSession && activeSession.sealMode === SEAL_REPORT) {
              const seal = currentSeal();
              activeSession.sealReport = seal ? bytesHash(seal, activeSession.seed) : null;
            }
            const raw = det.probeResult | 0;
            const cleaned = telemetry.cleanProbeResult(raw, probes, probeSalt);
            det.probeResult = cleaned;
            const warnings = telemetry.auditProbeResult(raw, cleaned, probes, probeSalt);
            if (warnings.length) {
              console.warn(LOG_PREFIX, LOG_STYLE, "probe audit warnings:", warnings);
            }
          }

          MooMoo._dispatch(spec.event, payload);
          if (spec.event === "setup") MooMoo._setReady(true);
        }

        function attachSession(ws) {
          activeSocket = ws;
          activeSession = null;
          outgoing.reset();

          const onMessage = (ev) => {
            const hs = !activeSession && protocol.isHandshake(ev.data);
            if (hs) {
              try {
                const mod = activeProto || root.MooMooProtocolModule || root.__moomooProtocol || null;
                const seal = currentSeal();
                activeSession = new protocol.ClientSession(hs[1], mod, { seal });
                if (activeSession.sealMode === SEAL_OFF) activeSession.sealReport = null;
                lastSentSeq = activeSession.lastSeq;
                lastSentLedger = activeSession.ledger;
              } catch (e) {
                console.error(LOG_PREFIX, LOG_STYLE, "handshake session failed", e);
              }
              return;
            }
            handleIncomingFrame(ev.data);
          };

          ws.addEventListener("message", onMessage);
          ws.addEventListener("close", () => {
            if (activeSocket === ws) {
              activeSession = null;
              MooMoo._dispatch("disconnect", { reason: "closed" });
            }
          });

          wsHook.setTransform(ws, (rawData, nativeSend) => {
            if (!activeSession) {
              const hs = protocol.isHandshake(rawData);
              if (hs) {
                try {
                  const mod = activeProto || root.MooMooProtocolModule || root.__moomooProtocol || null;
                  const seal = currentSeal();
                  activeSession = new protocol.ClientSession(hs[1], mod, { seal });
                  if (activeSession.sealMode === SEAL_OFF) activeSession.sealReport = null;
                  lastSentSeq = activeSession.lastSeq;
                  lastSentLedger = activeSession.ledger;
                } catch (e) {
                  console.error(LOG_PREFIX, LOG_STYLE, "handshake transform failed", e);
                }
              }
              return rawData;
            }

            let bytes;
            if (rawData instanceof ArrayBuffer) bytes = new Uint8Array(rawData);
            else if (ArrayBuffer.isView(rawData)) bytes = new Uint8Array(rawData.buffer, rawData.byteOffset, rawData.byteLength);
            else return rawData;

            try {
              const pkt = activeSession.decodeC2S(bytes);
              if (pkt.name === telemetry.wire) {
                const inspected = telemetry.inspect(pkt.args);
                det.flags = inspected.flags;
                det.untrusted = inspected.untrusted;
                if (inspected.probeResult) det.probeResult = inspected.probeResult;
                const ctx = telemetryCtx();
                const scrubbedArgs = telemetry.scrub(pkt.args, ctx);
                const reEncoded = activeSession.encodeC2S(pkt.name, scrubbedArgs, pkt.seq);
                lastSentSeq = activeSession.lastSeq;
                lastSentLedger = activeSession.ledger;
                outgoing.record(pkt.name);
                return reEncoded;
              }

              const info = { source: "game", wire: pkt.name };
              const parsed = binding.outgoingParse[pkt.name];
              if (parsed) {
                const filtered = MooMoo._filterOutgoing(parsed.action, parsed.parse(pkt.args), info);
                if (!filtered) return undefined;
                if (!outgoing.allow(pkt.name)) return undefined;
                const newArgs = binding.outgoing[parsed.action].build(filtered);
                const reEncoded = activeSession.encodeC2S(pkt.name, newArgs, pkt.seq);
                lastSentSeq = activeSession.lastSeq;
                lastSentLedger = activeSession.ledger;
                outgoing.record(pkt.name);
                MooMoo._notifySent(parsed.action, filtered, "game");
                return reEncoded;
              }

              if (!outgoing.allow(pkt.name)) return undefined;
              lastSentSeq = pkt.lastSeq;
              lastSentLedger = pkt.seq;
              outgoing.record(pkt.name);
              return rawData;
            } catch (_) {
              return rawData;
            }
          });
        }

        let wsHook;
        try {
          wsHook = installWebSocketProxy(
            root,
            (ws) => attachSession(ws),
            (err) => { try { console.warn(LOG_PREFIX, LOG_STYLE, "ws proxy:", err && err.message || err); } catch (_) {} }
          );
        } catch (e) {
          console.error(LOG_PREFIX, LOG_STYLE, "failed to install WebSocket proxy", e);
          wsHook = { native: root.WebSocket, setTransform: () => {}, nativeSend: (ws, d) => ws.send(d) };
        }

        function setProtocolModule(mod) {
          activeProto = mod;
          root.MooMooProtocolModule = mod;
        }

        const publicApi = Object.assign(MooMoo, {
          api,
          setProtocolModule,
          getSeal: () => bytesToHex(currentSeal()),
          resetSeal: () => {
            const fresh = randomSeal();
            rawSeal.set(fresh);
            lsSet(SEAL_KEY, bytesToHex(fresh));
            return bytesToHex(fresh);
          },
          _getDetectionState: () => Object.assign({}, det)
        });

        try {
          Object.defineProperty(root, "MooMoo", {
            value: publicApi,
            writable: true,
            enumerable: true,
            configurable: true
          });
        } catch (_) {
          root.MooMoo = publicApi;
        }

        try {
          root.addEventListener("moomoo.js:api", function onApiReq(ev) {
            const detail = ev && ev.detail;
            if (detail && typeof detail.resolve === "function") detail.resolve(publicApi);
          });
          root.dispatchEvent(new CustomEvent("moomoo.js:ready", { detail: { MooMoo: publicApi } }));
        } catch (_) {}

        MooMoo.log("ready v" + VERSION);
      })();
    }).call(
      __ns,
      typeof window !== "undefined" ? window : globalThis,
      typeof window !== "undefined" ? window : globalThis,
      { exports: {} },
      {},
      function () { return null; }
    );
  }

  if (typeof window !== "undefined") {
    core();
  }
})();
