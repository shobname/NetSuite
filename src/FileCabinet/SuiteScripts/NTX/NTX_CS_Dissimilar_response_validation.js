/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
/*1.0       shobiya     april 21 2022       /BA-89159 component swap
 */

define(['N/runtime'],

function(runtime) {

    var prior_ms_internalid = null;

    let prior_sub_id = '';
    let obj = {};
   function saveRecord(scriptContext) {

     let x =   runtime.getCurrentScript();
     alert(x);
     return false;

       debugger;
       var currentRecord = scriptContext.currentRecord;
       let __label = currentRecord.getValue('custpage_response');

       if (__label == 'reject') {
           let rejection_reason = currentRecord.getValue('custpage_rejection_reason');
           if (!rejection_reason) {
               alert('Please enter rejection reason');
               return false;
           }
       }
       if (__label == 'approve'){

           var ii = 1;
       while (currentRecord.getLineCount('custpage_sublist_add_milestone' + ii) > 0) {

           var numLines = currentRecord.getLineCount('custpage_sublist_add_milestone' + ii);

           var _lineNumber = currentRecord.findSublistLineWithValue({
               sublistId: 'custpage_sublist_add_milestone' + ii,
               fieldId: 'custpage_select_box' + ii,
               value: 'T'
           });
           if (_lineNumber == -1) {
               alert('Please select your option')
               return false;
           }

           ii++;


       }
   }
       return true;
   }


function disableFields(disabled,currentRecord,_label){

    let newVal  =!disabled;
    currentRecord.getField({
        fieldId : 'custpage_rejection_reason'
    }).isDisabled = newVal;
    if (newVal) {
        currentRecord.setValue({
            fieldId: 'custpage_rejection_reason',
            value: '',
            ignoreFieldChange:true
        })
    }


    let c = 1;
    while(currentRecord.getLineCount({
        sublistId: 'custpage_sublist_add_milestone'+c
    }) >-1){
        let count= currentRecord.getLineCount({
            sublistId: 'custpage_sublist_add_milestone'+c
        });
        for(let q=0;q<count;q++) {


            var objField = currentRecord.getSublistField({
                sublistId: 'custpage_sublist_add_milestone' + c,
                fieldId: "custpage_select_box" + c,
                line: q// this comes with count
            }).isDisabled = disabled;
        }

        c++;
    }

}
    function fieldChanged(scriptContext) {
        try {
            debugger;

            var currentRecord = scriptContext.currentRecord;
            var fld = scriptContext.fieldId;
            var sublist_id = scriptContext.sublistId;

let sub_id;

if (fld == 'custpage_response') {
   let __label= currentRecord.getValue(fld);

if(__label =='approve'){
    disableFields(false,currentRecord);

}
   if(__label == 'reject'){



       disableFields(true,currentRecord);


       for (const sub_id in obj) {
               if ('custpage_sublist_add_milestone' + sub_id) {




              //     chkbox.isDisabled = true;

                   var _lineNumber = currentRecord.findSublistLineWithValue({
                       sublistId: 'custpage_sublist_add_milestone' + sub_id,
                       fieldId: 'custpage_child_internalid' + sub_id,
                       value: obj[sub_id]
                   });

                   var recordLine = currentRecord.selectLine({
                       sublistId: 'custpage_sublist_add_milestone' + sub_id,
                       line: _lineNumber
                   });

                   currentRecord.setCurrentSublistValue({
                       sublistId: 'custpage_sublist_add_milestone' + sub_id,
                       fieldId: 'custpage_select_box' + sub_id,
                       value: false
                   });

           }
           }
           //custpage_rejection_reason

   }

}
           if(sublist_id && sublist_id.indexOf('custpage_sublist_add_milestone') >-1) {
                sub_id = sublist_id.replace('custpage_sublist_add_milestone', '');
            }
           // if(!sub_id) sub_id= current_sub_id;
            //if(sub_id != current_sub_id) prior_ms_internalid=null;

            if (sublist_id == 'custpage_sublist_add_milestone'+sub_id && fld == 'custpage_select_box'+sub_id) {


                var _checkbox = currentRecord.getCurrentSublistValue({
                    sublistId: 'custpage_sublist_add_milestone'+sub_id,
                    fieldId: 'custpage_select_box'+sub_id
                });

                    if (_checkbox == true) {


                        var msInternalId = currentRecord.getCurrentSublistValue({
                            sublistId: 'custpage_sublist_add_milestone'+sub_id,
                            fieldId:'custpage_child_internalid'+sub_id
                        });
if(!prior_sub_id) prior_sub_id = sub_id;
if(prior_sub_id != sub_id){
    prior_ms_internalid= obj[sub_id] || null;
    prior_sub_id =sub_id
}
/*else{
    prior_sub_id = sub_id;
}*/
                        obj[sub_id] =msInternalId;
                        if (!prior_ms_internalid) {
                            prior_ms_internalid = msInternalId;
                         //   obj[sub_id] =msInternalId;
                        }
                        else {

                            if (msInternalId != prior_ms_internalid) {
                            var _lineNumber = currentRecord.findSublistLineWithValue({
                                sublistId: 'custpage_sublist_add_milestone' + sub_id,
                                fieldId: 'custpage_child_internalid' + sub_id,
                                value: prior_ms_internalid
                            });

                            if (_lineNumber>=0) {

                                var recordLine = currentRecord.selectLine({
                                    sublistId: 'custpage_sublist_add_milestone' + sub_id,
                                    line: _lineNumber
                                });

                                currentRecord.setCurrentSublistValue({
                                    sublistId: 'custpage_sublist_add_milestone' + sub_id,
                                    fieldId: 'custpage_select_box' + sub_id,
                                    value: false
                                });
                                //obj[sub_id] =msInternalId;
                                prior_ms_internalid=msInternalId;
                            }
                            }


                        }


                    }





            }




        } catch (ex) {
          //  alert(ex);
            log.error('fieldChange:', ex);

        }
    }



    return {

        fieldChanged: fieldChanged,
        saveRecord:saveRecord


    };
    
});
