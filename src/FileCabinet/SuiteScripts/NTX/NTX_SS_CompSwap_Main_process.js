/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */

/*1.0       shobiya     april 21 2022       /BA-89159 component swap
 */
define(['N/task','N/search', 'N/record', 'N/error', 'N/runtime'],

    (task,search, record, error, runtime) => {
        let script = runtime.getCurrentScript();

        const RemoveLines_ClosePO = (soId) => {

            const DUMMY_ITEM = script.getParameter('custscript_ntx_ss_compswap_po_item');

            let so = record.load({
                type: 'salesorder',
                id: soId
            });
            var lineCount = so.getLineCount({
                sublistId: 'links'
            });

            for (var q = 0; q < lineCount; q++) {


                var _type = so.getSublistValue({
                    sublistId: 'links',
                    fieldId: "type",
                    line: q
                });
                var linktype = so.getSublistValue({
                    sublistId: 'links',
                    fieldId: "linktype",
                    line: q
                });
                if (_type == 'Purchase Order' && linktype == 'Special Order') {
                    var po_id = so.getSublistValue({
                        sublistId: 'links',
                        fieldId: "id",
                        line: q
                    });
                    var poRec = record.load({
                        type: 'purchaseorder',
                        id: po_id
                    });
                    var lineCount = poRec.getLineCount({
                        sublistId: 'item'
                    });
                    for (let i = lineCount - 1; i >= 0; i--) {

                        poRec.removeLine({
                            sublistId: 'item',
                            line: i
                        });
                    }


                    poRec.insertLine({
                        sublistId: 'item',
                        line: 0,
                    });

                    poRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: DUMMY_ITEM,
                        line: 0
                    });

                    poRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'isclosed',
                        line: 0,
                        value: true
                    });


                    let poId = poRec.save();
                    log.debug('po id', poId)

                }

                return true;

            }
        }

        const swapInSO = (soId, jsonData, lineID, xml_type) => {

            let actual_LineId = parseInt(lineID) - 1;

            log.debug('swapping proces', actual_LineId + "::" + soId);


            let parseData = JSON.parse(jsonData);
            let to_sku = parseData['to_sku'];
            let to_quan = parseData['to_quan'];
            let po_id = parseData['po_id'];
            let model = parseData['model'];
            let delinked_po = RemoveLines_ClosePO(soId);

            let _values = {
                "amount": '',
                "rate": '',
                "custcol_sf_order_required_by_line": '',
                "custcol_sf_order_line_id": '',
                "custcol_global_list_price": '',
                "custcol_list_amount": '',
                "custcol_ntnx_arm_rr_start_date": '',
                "custcol_ntnx_arm_rr_end_date": '',
                "quantity": '',
                "custcol_term_days": '',
                "custcol_term_months": '',
                "custcol_ntx_line_code": ""
            }

            let soRec = record.load({
                type: 'salesorder',
                id: soId
            });

            let vendorId = soRec.getValue('custbody_send_xml_to');

            for (const property in _values) {
                _values[property] = soRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: property,
                    line: actual_LineId
                });
            }
            let existingLineQuan = _values['quantity'];



            if (existingLineQuan != to_quan) {
                let existingLineAmount = _values['amount'];
                let unitprice = parseFloat(existingLineAmount) / parseFloat(existingLineQuan);
                _values['rate'] = unitprice;
                _values['quantity'] = to_quan;
            }
            soRec.removeLine({
                sublistId: 'item',
                line: actual_LineId
            });
            let toSkuId = getToSku(to_sku);
            log.debug('itemid', toSkuId);
            soRec.insertLine({
                sublistId: 'item',
                line: actual_LineId,
            });

            soRec.setSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                value: toSkuId,
                line: actual_LineId
            });

            for (var property in _values) {
                log.debug('property', property)
                soRec.setSublistValue({
                    sublistId: 'item',
                    fieldId: property,
                    value: _values[property],
                    line: actual_LineId
                });
            }
            log.debug('setting hold signal', soId);
            soRec.setValue({
                fieldId: 'custbody_ordertype',
                value: 2
            });
            soRec.setValue({
                fieldId: 'custbody_resend_order',
                value: true
            });

            soRec.save();
            log.debug('createpo');
            //create po
            create_spl_ord_po(soId, vendorId);

            //ack email to

        }
        const create_spl_ord_po = (salesOrderId, vendorId) => {

            log.debug('test');
            var entityId = search.lookupFields({
                type: 'salesorder',
                id: salesOrderId,
                columns: ['entity']
            })['entity'][0].value;


            var params = {
                'recordmode': 'dynamic',
                'soid': salesOrderId,
                'specord': 'T',
                'custid': entityId,
                'entity': vendorId,
                'poentity': vendorId
            };
            var po = record.create({
                type: record.Type.PURCHASE_ORDER,
                isDynamic: true,
                defaultValues: params
            });

            po.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
        }
        const getToSku = (toSku) => {
            log.debug('tosku search', toSku);
            var itemSearchObj = search.create({
                type: "item",
                filters: [
                    ["name", "is", toSku]
                ]


            });
            var resultSet = itemSearchObj.run().getRange(0, 1);
            if (resultSet && resultSet.length > 0)
                return (resultSet[0].id)

            /*
            itemSearchObj.id="customsearch1651674463105";
            itemSearchObj.title="Item Search kjasdlksadsad (copy)";
            var newSearchId = itemSearchObj.save();
            */
        }
        const execute = (scriptContext) => {
            log.debug('start process');
            const searchId = script.getParameter('custscript_ntx_ss_compswap_process');
            var MINIMUM_USAGE = 500;
            var scriptObj = runtime.getCurrentScript();

            var searchResult = search.load({
                id: searchId
            }).run();
            searchResult.each(function(result) {
                try {
                    if (scriptObj.getRemainingUsage() > MINIMUM_USAGE) {
                    var soId = result.getValue({
                        name: "custrecord_ntx_cs_lst_salesorder",
                        join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
                    });
                    var uniqueKey = result.getValue({
                        name: "custrecord_ntx_cs_lst_uniquekey",
                        join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
                    });
                    var xmlType = result.getValue({
                        name: "custrecord_ntx_cs_xml_type",
                        join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
                    });
                    var jsonData = result.getValue({
                        name: "custrecord_ntx_cs_option_json"
                    });
                    var lineID = result.getValue({
                        name: "custrecord_ntx_cs_so_line_id"
                    });
                    var parentID = result.getValue({
                        name: "custrecord_ntx_cs_lst_parent_so",
                        sort: search.Sort.DESC,
                        label: "component swap salesorders"
                    });


                    swapInSO(soId, jsonData, lineID, xmlType);
                    log.debug('done');
                    record.submitFields({
                        type: 'customrecord_ntx_cs_user_response_parent',
                        id: parentID,
                        values: {
                            'custrecord_ntx_cs_error_log': '',
                            'custrecord_ntx_cs_lst_current_status': 4
                        }

                    });
                }
                else{
                        var scheduledScript = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT
                        });
                        scheduledScript.scriptId = scriptObj.id;
                        scheduledScript.deploymentId = scriptObj.deploymentId;

// Submit the scheduled task
                        var schTaskId = scheduledScript.submit();

                        if (schTaskId)
                            log.debug('Script is successfully rescheduled');

                }
                } catch (e) {

                    var err = 'System error: ' + e.name + '\n' + e.message + "" + e.stack;

                    log.error('err', err);
                    //    log.error(e.name, e.message);
                    record.submitFields({
                        type: 'customrecord_ntx_cs_user_response_parent',
                        id: parentID,
                        values: {
                            'custrecord_ntx_cs_error_log': err,
                            'custrecord_ntx_cs_lst_current_status': 5
                        }

                    });
                }
                return true;
            });


        }

        return {
            execute
        }

    });