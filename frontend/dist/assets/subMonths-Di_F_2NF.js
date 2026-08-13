import{c as f}from"./createLucideIcon-CWJkqM-4.js";import{t as a,c as i}from"./format-D0LMOwrc.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=f("Ban",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m4.9 4.9 14.2 14.2",key:"1m5liu"}]]);function h(t,e){const n=a(t);if(isNaN(e))return i(t,NaN);if(!e)return n;const o=n.getDate(),s=i(t,n.getTime());s.setMonth(n.getMonth()+e+1,0);const c=s.getDate();return o>=c?s:(n.setFullYear(s.getFullYear(),s.getMonth(),o),n)}function y(t){const e=a(t),n=e.getMonth();return e.setFullYear(e.getFullYear(),n+1,0),e.setHours(23,59,59,999),e}function M(t,e){const n=a(t.start),o=a(t.end);let s=+n>+o;const c=s?+n:+o,r=s?o:n;r.setHours(0,0,0,0);let d=1;const u=[];for(;+r<=c;)u.push(a(r)),r.setDate(r.getDate()+d),r.setHours(0,0,0,0);return s?u.reverse():u}function m(t){const e=a(t);return e.setDate(1),e.setHours(0,0,0,0),e}function p(t){return a(t).getDay()}function F(t){return+a(t)<Date.now()}function O(t,e){return h(t,-1)}export{g as B,M as a,O as b,h as c,y as e,p as g,F as i,m as s};
