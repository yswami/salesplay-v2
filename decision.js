/* Pure rules shared by the UI and verification harness. */
(function(root){
 const fields=['core','upgraded','winding','testing','demandLow','demandHigh'];
 function calculate(input){
   const missing=fields.filter(k=>input[k]===null||input[k]===''||input[k]===undefined);
   const errors=[];
   for(const k of [...fields,'contribution']){
     if(input[k]===null||input[k]===''||input[k]===undefined)continue;
     if(typeof input[k]!=='number'||!Number.isFinite(input[k])||input[k]<0||input[k]>1e9)errors.push(k+' must be a number between 0 and 1,000,000,000.');
   }
   if(!missing.includes('demandLow')&&!missing.includes('demandHigh')&&input.demandLow>input.demandHigh)errors.push('Demand minimum must not exceed demand maximum.');
   if(!missing.includes('core')&&!missing.includes('upgraded')&&input.upgraded<input.core)errors.push('Proposed core capacity must be at least current core capacity.');
   if(missing.length||errors.length)return {complete:false,missing,errors};
   const currentCapacity=Math.min(input.core,input.winding,input.testing);
   const proposedCapacity=Math.min(input.upgraded,input.winding,input.testing);
   const at=d=>({current:Math.min(d,currentCapacity),proposed:Math.min(d,proposedCapacity)});
   const low=at(input.demandLow),high=at(input.demandHigh);
   const gainLow=low.proposed-low.current,gainHigh=high.proposed-high.current;
   const contribution=input.contribution===null||input.contribution===''||input.contribution===undefined?null:[gainLow*input.contribution,gainHigh*input.contribution];
   return {complete:true,currentCapacity,proposedCapacity,low,high,gainLow,gainHigh,contribution};
 }
 function decision(s){
   const c=calculate(s.inputs);
   if(!c.complete)return {key:'incomplete',label:'Complete the case',tone:'amber',title:'A few inputs are still needed.',next:'Validate the missing or invalid planning inputs before using an output estimate.'};
   if(c.gainHigh===0)return {key:'hold',label:'Hold equipment proposal',tone:'amber',title:'Resolve the limiting step first.',next:s.inputs.testing<=Math.min(s.inputs.core,s.inputs.winding)?'Review the testing constraint with the plant team before proposing stacking equipment.':'Review demand and the limiting production stage before proposing additional core capacity.'};
   if(!s.researchEnabled)return {key:'research',label:'Validate segment fit',tone:'amber',title:'Recheck the market connection.',next:'Validate the segment and delivery conditions before relying on this opportunity. The capacity scenario remains illustrative.'};
   if(s.buyerUpdate==='confirmed')return {key:'assess',label:'Prepare technical assessment',tone:'green',title:'Test the technical route to additional output.',next:'Agree a process and integration assessment with the plant team. Validate eligible demand and delivery timing in parallel.'};
   return {key:'validate',label:'Validate capacity',tone:'green',title:'A growth opportunity worth validating.',next:'Ask the plant team whether core assembly limits the eligible product line during the target quarter.'};
 }
 const api={calculate,decision,fields};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.SP=root.SP||{};root.SP.rules=api;
})(typeof window!=='undefined'?window:globalThis);
