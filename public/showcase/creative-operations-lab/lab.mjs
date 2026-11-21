import { readiness } from './workflow.mjs';
let record;
function render(){document.querySelector('#revision').textContent=`Concept revision ${record.revision}. Approved revision ${record.approvedRevision ?? 'none'}.`;document.querySelector('#status').textContent=readiness(record).reason;document.querySelector('#sample').checked=record.sampleAccepted;document.querySelector('#fulfillment').checked=record.fulfillmentVerified;}
function reset(){record={revision:1,approvedRevision:null,sampleAccepted:false,fulfillmentVerified:false};render();}
document.querySelector('#approve').onclick=()=>{record.approvedRevision=record.revision;render();};
document.querySelector('#revise').onclick=()=>{record.revision++;record.sampleAccepted=false;record.fulfillmentVerified=false;render();};
document.querySelector('#sample').onchange=e=>{record.sampleAccepted=e.target.checked;render();};
document.querySelector('#fulfillment').onchange=e=>{record.fulfillmentVerified=e.target.checked;render();};
document.querySelector('#reset').onclick=reset;reset();
