/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

function() {

    var prior_ms_internalid = null;

    let prior_sub_id = '';
    let obj = {};
    function fieldChanged(scriptContext) {
        try {
            debugger;

            var currentRecord = scriptContext.currentRecord;
            var fld = scriptContext.fieldId;
            var sublist_id = scriptContext.sublistId;
let sub_id;
            if(sublist_id.indexOf('custpage_sublist_add_milestone') >-1) {
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
            log.error('fieldChange:', ex);

        }
    }



    return {

        fieldChanged: fieldChanged,

    };
    
});
