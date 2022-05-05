/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['SuiteScripts/NTX/NTX_Lib_Swap.js','N/search','N/record','N/ui/serverWidget','N/format'],
    
    (libCS,search,record,ui,format) => {

        const getResultsFromUniqueKey=(unique_key)=>{
         //   throw unique_key;
            var customrecord_ntx_cs_user_response_parentSearchObj = search.create({
                type: "customrecord_ntx_cs_user_response_parent",

                // title: 'shobiya' + new Date(),
                filters:
                    [
                        ["custrecord_ntx_cs_lst_uniquekey","equalto",unique_key],
                        'and',
                        ["isinactive","is",'F'],
                        'and',
                        ['custrecord_ntx_cs_lst_current_status', 'is',2],
                        'and',
                        ["custrecord_ntx_cs_lst_parent_so.isinactive","is","F"]
                    ],
                columns:
                    [
                        search.createColumn({name: "custrecord_ntx_cs_lst_current_status", label: "Current Status"}),
                        search.createColumn({name: "custrecord_ntx_cs_lst_customer_response", label: "Customer response"}),
                        search.createColumn({name: "custrecord_ntx_cs_dt_response_received", label: "customer response received on"}),
                        search.createColumn({name: "custrecord_ntx_cs_dt_email_sent_on", label: "email sent on"}),
                        search.createColumn({name: "custrecord_ntx_cs_lst_salesorder", label: "sales order"}),
                        search.createColumn({name: "custrecord_ntx_cs_xml_type", label: "type"}),
                        search.createColumn({name: "custrecord_ntx_cs_lst_uniquekey", label: "unique key"}),
                        search.createColumn({
                            name: "custrecord_ntx_cs_lst_parent_so",
                            join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
                        }),
                        search.createColumn({
                            name: "custrecord_ntx_cs_option_json",
                            join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
                        }),
                        search.createColumn({
                            name: "custrecord_ntx_cs_so_line_id",
                            join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
                        }),


                        search.createColumn({
                            name: "internalid",
                            join: "CUSTRECORD_NTX_CS_LST_PARENT_SO",
                            sort: search.Sort.DESC,
                            label: "Internal ID"
                        })
                    ]
            });
       //  let x=   customrecord_ntx_cs_user_response_parentSearchObj.save();
         //log.debug(';test',x)
            var searchResultCount = customrecord_ntx_cs_user_response_parentSearchObj.runPaged().count;
            log.debug('count',searchResultCount);
            return customrecord_ntx_cs_user_response_parentSearchObj;
        }
        const onRequest = (context) => {
            serverWidget=ui;
            if (context.request.method === 'GET') {

                var form = ui.createForm({
                    title: 'Response Form'
                });
                var request = context.request;

                var unique_key = request.parameters.unique_key;

                let customrecord_ntx_cs_user_response_parentSearchObj = getResultsFromUniqueKey(unique_key);
                var searchResultCount = customrecord_ntx_cs_user_response_parentSearchObj.runPaged().count;
                var _mainbody = '';
                //throw searchResultCount;
                if(searchResultCount ==0){
                   throw "This swapping is processed, please contact fulfillment@nutanix.com more details.";
                }

let sub_id=1;
let all_from_sku=[];
                let num='';
                var sublist ='';
                let x=0;

                var approve = form.addField({
                    id: 'custpage_response',
                    label: 'Approve',
                    type: 'RADIO',
                    source: "approve",

                 //   container: "custpage_filtergroup"
                });
             // approve.defaultValue = 'approve1';

                var reject = form.addField({
                    id: 'custpage_response',
                    label: 'Reject',
                    type: 'RADIO',
                    source: "reject",

                  //  container: "custpage_filtergroup"
                });
                form.updateDefaultValues({
                    values: { custpage_response: 'approve' }
                })

              //  action1.defaultValue ='F';
                customrecord_ntx_cs_user_response_parentSearchObj.run().each(function(result) {



let current_status  = result.getValue({
                        name: "custrecord_ntx_cs_lst_current_status"
                    });
//if(current_status !=2){
    // throw "This swapping is processed, please contact fulfillment@nutanix.com more details. "
//}
                        let option_internalid = result.getValue({
                            name: "internalid",
                            join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
                        });

                        let options_json = result.getValue({
                            name: "custrecord_ntx_cs_option_json",
                            join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
                        });

                        let parse_data = JSON.parse((options_json));
                   // throw parse_data;
  //                  throw  parse_data['model'];//model
//throw JSON.stringify(parse_data);


                    let from_sku=parse_data['from_sku'];
log.debug('all sku',all_from_sku.indexOf(from_sku));
                   if(all_from_sku.indexOf(from_sku)==-1) {
                   // if(1==1){
                         num=sub_id;//option_internalid; // Math.floor(Math.random() * 1000);
                         sublist = form.addSublist({
                            id: 'custpage_sublist_add_milestone'+sub_id,
                            type: ui.SublistType.LIST,
                            label: from_sku
                        });

                        sublist.addField({
                            id: 'custpage_select_box' + num,
                            type: ui.FieldType.CHECKBOX,
                            label: 'SELECT'
                        }).updateDisplayType({
                            displayType: ui.FieldDisplayType.ENTRY
                        });
                        sublist.addField({
                            id: 'custpage_child_internalid'+num,
                            type: ui.FieldType.TEXT,
                            label: 'child internalid'
                        }).updateDisplayType({
                            displayType: ui.FieldDisplayType.HIDDEN
                        });
                        sublist.addField({
                            id: 'custpage_parent_internalid'+num,
                            type: ui.FieldType.TEXT,
                            label: 'parent internalid'
                        }).updateDisplayType({
                            displayType: ui.FieldDisplayType.NORMAL
                        });
                        sublist.addField({
                            id: 'custpage_fromsku' + num,
                            type: ui.FieldType.TEXT,
                            label: 'from sku'
                        });
                        sublist.addField({
                            id: 'custpage_fromquan' + num,
                            type: ui.FieldType.TEXT,
                            label: 'from quan'
                        });
                        sublist.addField({
                            id: 'custpage_tosku' + num,
                            type: ui.FieldType.TEXT,
                            label: 'to sku'
                        });
                        sublist.addField({
                            id: 'custpage_toquan' + num,
                            type: ui.FieldType.TEXT,
                            label: 'to quan'
                        });


                        all_from_sku.push(from_sku);
x=0;
                        sub_id++;
                   }
                   // throw x;
                    sublist.setSublistValue({
                        id: 'custpage_child_internalid'+num,
                        line: x,
                        value: option_internalid
                    });
                    sublist.setSublistValue({
                        id: 'custpage_parent_internalid'+num,
                        line: x,
                        value: result.id
                    });
                    sublist.setSublistValue({
                        id: 'custpage_fromsku'+num,
                        line: x,
                        value: parse_data['from_sku'] // remove .00 from numbers
                    });
                  sublist.setSublistValue({
                        id: 'custpage_fromquan'+num,
                        line: x,
                        value: parse_data['from_quan']
                    });
                       sublist.setSublistValue({
                          id: 'custpage_tosku'+num,
                          line: x,
                          value: parse_data['to_sku'] // remove .00 from numbers
                      });
                      sublist.setSublistValue({
                          id: 'custpage_toquan'+num,
                          line: x,
                          value: parse_data['to_quan']
                      });

                    x++;
                    return true;
                    });

//i++;

               /* form.addButton({
                    label: 'Approve',
                    id: "custpage_btn_approve",
                    functionName:"approve()"
                });
                form.addButton({
                    label: 'Reject',
                    id: "custpage_btn_reject"
                });*/
                form.addSubmitButton({
                    id:'custpage_btn_submit',
                    label:'submit response'
                })
                form.clientScriptFileId = 18125554;
                context.response.writePage(form);

            }
            else if (context.request.method === 'POST') {
                var req = context.request;
                let i = 1;let parentid='';
let isApproved ='F'
                while (req.parameters['custpage_sublist_add_milestone'+i+'data']) {
                    var __row = req.parameters['custpage_sublist_add_milestone'+i+'data'];

                    var rows = __row.split('\u0002');
                    rows.forEach(function(row) {

                        var fields = row.split('\u0001');
 parentid = fields[2];
                        if (fields[0] == 'T') {
                            isApproved='T';
                            let selected_id = fields[1];//internalid//submit in this internal id as selected
log.debug(selected_id);
                            record.submitFields({
                                type: 'customrecord_ntx_cs_user_response',
                                id: selected_id,
                                values: {
                                    'custrecord_ntx_cs_selected_by_user': 'T'
                                }
                            });
                        }


                    });
                    i++;
                }
                var dt = format.format({
                    value: new Date(),
                    type: format.Type.DATETIME
                });
                record.submitFields({
                    type: 'customrecord_ntx_cs_user_response_parent',
                    id: parentid,
                    values: {
                        'custrecord_ntx_cs_lst_current_status':3,
                        'custrecord_ntx_cs_dt_response_received':dt,
                        'custrecord_ntx_cs_lst_customer_response':isApproved =='T'? 1:2
                    }
                });


                context.response.write('Thankyou for your response, its recorded in the system');




            }
        }

        return {onRequest}

    });
