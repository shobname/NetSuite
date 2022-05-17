/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/*
* throw error if sames so, in ready status*/

/*1.0       shobiya     april 21 2022       /BA-89159 component swap
 */

define(['N/search', 'N/record'],

    (search, record) => {
        const SoExist = (soid) => {
            var customrecord_ntx_cs_user_response_parentSearchObj = search.create({
                type: "customrecord_ntx_cs_user_response_parent",
                filters:
                    [
                        ["custrecord_ntx_cs_lst_salesorder.internalidnumber", "equalto", soid],
                        "AND",
                        ["custrecord_ntx_cs_lst_current_status", "anyof", "1", "2", "3"],
                        "AND",
                        ["custrecord_ntx_cs_lst_salesorder.mainline", "is", "T"]
                    ]
            });
            var searchResultCount = customrecord_ntx_cs_user_response_parentSearchObj.runPaged().count;
            if (searchResultCount > 0) {
                return true;
            }
            return false;
        }
        const inactivateChildRecord = (parent_id) => {
            var customrecord_ntx_cs_user_response_parentSearchObj = search.create({
                type: "customrecord_ntx_cs_user_response_parent",
               //     title:'sbhoya test 1234',
                filters:
                    [
                        ["custrecord_ntx_cs_lst_parent_so.isinactive", "is", "F"],
                        "AND",
                        ["internalidnumber", "equalto", parent_id]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "isinactive",
                            join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
                        })
                    ]
            });
           // customrecord_ntx_cs_user_response_parentSearchObj.save();
            var searchResultCount = customrecord_ntx_cs_user_response_parentSearchObj.runPaged().count;
            log.debug("customrecord_ntx_cs_user_response_parentSearchObj result count", searchResultCount);
            customrecord_ntx_cs_user_response_parentSearchObj.run().each(function (result) {
                let child_id = result.getValue({
                    name: "internalid",
                    join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
                });
                if(child_id) {
                    record.submitFields({
                        type: 'customrecord_ntx_cs_user_response',
                        id: child_id,
                        values: {
                            'isinactive': true
                        }
                    });
                }
                // .run().each has a limit of 4,000 results
                return true;
            });

            /*
            customrecord_ntx_cs_user_response_parentSearchObj.id="customsearch1651663525991";
            customrecord_ntx_cs_user_response_parentSearchObj.title="Component Swap -SO & User resp (Parent) Search 123 (copy)";
            var newSearchId = customrecord_ntx_cs_user_response_parentSearchObj.save();
            */
        }
        const beforeSubmit = (scriptContext) => {

            let newRec = scriptContext.newRecord;
            let _mode = scriptContext.type;
            if (_mode == 'edit') {
                if (newRec.getValue('custrecord_ntx_cs_lst_current_status') == 1
                    && scriptContext.oldRecord.getValue('custrecord_ntx_cs_lst_current_status') != 1) {
                    // throw "test"
                    inactivateChildRecord(newRec.id);
                    newRec.setValue('custrecord_ntx_cs_lst_uniquekey', '');
                    newRec.setValue('custrecord_ntx_cs_dt_email_sent_on', '');
                    newRec.setValue('custrecord_ntx_cs_dt_response_received', '');
                    newRec.setValue('custrecord_ntx_cs_lst_customer_response', '');
                    newRec.setValue('custrecord_ntx_cs_xml_type', '');
                    newRec.setValue('custrecord_ntx_cs_error_log', '');
                }
            }


            if (_mode == 'create' || _mode == 'copy') {
                //   if(1==1){

                let soid = newRec.getValue('custrecord_ntx_cs_lst_salesorder');

                if (SoExist(soid)) throw "Salesorder already exist in table, please wait till it gets processed.";
                return true;
            }
        }


        return {beforeSubmit}

    });
