/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */

/*1.0       shobiya     april 21 2022       /BA-89159 component swap
 */
define(['N/record', 'N/search', 'N/format', 'N/runtime'],

    (record, search, format, runtime) => {

        //


        const getHrDifference = (emailSendOn) => {

            var dt2 = new Date(emailSendOn);
            var dt1 = new Date()
            var diff = (dt2.getTime() - dt1.getTime()) / 1000;
            diff /= (60 * 60);
            return Math.abs(Math.round(diff));
        }
        const updateRecords = (result) => {
            let parentID = result.id;
            let childID = result.getValue({
                name: "internalid",
                join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
            });

            var dt = format.format({
                value: new Date(),
                type: format.Type.DATETIME
            });

            //update parent rec and child
            record.submitFields({
                type: 'customrecord_ntx_cs_user_response_parent',
                id: parentID,
                values: {
                    "custrecord_ntx_cs_lst_current_status": 3,
                    "custrecord_ntx_cs_lst_customer_response": 3,
                    'custrecord_ntx_cs_dt_response_received': dt

                }
            })
            record.submitFields({
                type: 'customrecord_ntx_cs_user_response',
                id: childID,
                values: {
                    "custrecord_ntx_cs_selected_by_user": true
                }
            });
        }
        const execute = (scriptContext) => {
            let script = runtime.getCurrentScript();
            const searchID = script.getParameter('custscript_ntx_ss_no_resp_similar');
            var searchResult = search.load({
                id: searchID
            }).run();
            searchResult.each(function (result) {
                try {

                    let emailSentOn = result.getValue({name: "custrecord_ntx_cs_dt_email_sent_on"});
                    let _hours = getHrDifference(emailSentOn);
                    // log.debug('hrs', parentID + ":" + hrs)
                    if (parseFloat(_hours) > 48) {
                        updateRecords(result)
                    }
                    // return true;
                } catch (e) {
                    log.error('err while processing', e);
                } finally {
                    return true;
                }
            });
        }

        return {execute}

    });
