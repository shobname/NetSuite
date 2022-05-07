/**
 * @NApiVersion 2.1
 */
define([],
    
    () => {

        const create_salesorderSearchObj = (fil) => {
            return search.create({
                type: "salesorder",
                //  id:so_list,
                // title: 'testing' + new Date(),
                filters: fil,
                columns: [
                    search.createColumn({
                        name: "purchaseorder",
                        label: "Purchase Order"
                    }),
                    search.createColumn({
                        name: "item",
                        label: "Item"
                    }),
                    search.createColumn({
                        name: "line",
                        label: "Line ID"
                    }),
                    search.createColumn({
                        name: "custcol_sf_order_required_by_line", //
                        label: "SF Required By Order Line"
                    }),
                    search.createColumn({
                        name: "custcol_sf_order_line_id",
                        label: "SF Order Line ID"
                    }),
                    search.createColumn({
                        name: "quantity",
                        label: "Quantity"
                    }),
                    search.createColumn({
                        name: "custcol_unitprice",
                        label: "Unit Price"
                    }),
                    search.createColumn({
                        name: "custbody_disti_email_address"
                    }),
                    search.createColumn({
                        name: "email",
                        join: "CUSTBODY_SEND_XML_TO"
                    }),
                    search.createColumn({
                        name: "internalid",
                        join: "CUSTRECORD_NTX_CS_LST_SALESORDER"

                    }),

                    search.createColumn({
                        name: "email",
                        join: "CUSTBODY14",
                        label: "Email"
                    }),
                    search.createColumn({
                        name: "custrecord_ntx_cs_dt_email_sent_on",
                        join: "CUSTRECORD_NTX_CS_LST_SALESORDER"
                    }),
                    search.createColumn({
                        name: "custrecord_ntx_cs_dt_response_received",
                        join: "CUSTRECORD_NTX_CS_LST_SALESORDER"
                    }),
                    search.createColumn({
                        name: "custrecord_ntx_cs_lst_salesorder",
                        join: "CUSTRECORD_NTX_CS_LST_SALESORDER"
                    }),

                    search.createColumn({
                        name: "custrecord_ntx_cs_lst_uniquekey",
                        join: "CUSTRECORD_NTX_CS_LST_SALESORDER"
                    })
                ]
            });
        }
        const getProperty = (propertyName, obj) => {

            if (!obj.hasOwnProperty(propertyName)) {
                return null;
            }
            return parseInt(obj[propertyName]['currentkey']) + 1;
        }
            const constructTable=(_mainbody)=>{
                    _mainbody += '<style>\n' +
                        '.borderclass {\n' +
                        '  border: 1px solid black;\n' +
                        '  border-collapse: collapse;\n' +
                        '}\n' +
                        '\n' +
                        '#t01 {\n' +
                        '  width: 100%;    \n' +

                        '}\n' +
                        'th{font-weight: bold;}' +

                        '</style>'
                    _mainbody += '<table id="t01" class ="borderclass">\n' +
                        '  <thead style ="background: #DDDDDD;"><tr class="borderclass">\n' +

                        '    <th class="borderclass">CURRENT COMPONENT</th>\n' +
                        '    <th class="borderclass">SYSTEM QTY</th> \n' +
                        '    <th class="borderclass">NEW COMPONENT</th>\n' +

                        '    <th class="borderclass">SYSTEM QTY</th>\n' +

                        '  </tr></thead>\n';
                    return _mainbody;
            }
        const TriggerHoldSignalFromSO = (soId) => {
            record.load({
                type: 'salesorder',
                id: soId,
                values: {
                    'custbody_ordertype': '4',
                    'custbody_resend_order': 'T'
                }
            })
        }
        const create_rej_link = (uniqueId, body) => {
            let res = ['approve', 'reject'];
            for (const element of res) {
                let suiteletURLOutput = url.resolveScript({
                    scriptId: 'customscript_ntx_sl_cs_swap_email_respon',
                    deploymentId: 'customdeploy_ntx_sl_cs_swap_email_respon',
                    returnExternalUrl: true,
                    params: {
                        resp: element,
                        lineId: uniqueId
                    }
                });
                if (element == 'reject')
                    body = body.replace('##REJECTLINK##', suiteletURLOutput);
                else
                    body = body.replace('##APPROVELINK##', suiteletURLOutput);

            }
            return body;


        }


        const createChildRecords_for_similar = (soid, recent_so_details, property) => {
            var customRecord = record.create({
                type: 'customrecord_ntx_cs_user_response'
            });
            customRecord.setValue({
                fieldId: 'custrecord_ntx_cs_salesorder',
                value: soid
            });
            customRecord.setValue({
                fieldId: 'custrecord_ntx_cs_so_line_id',
                value: recent_so_details[property]['line_id']
            });
            customRecord.setValue({
                fieldId: 'custrecord_ntx_cs_from_sku',
                value: recent_so_details[property]['from_sku']
            });

            customRecord.setValue({
                fieldId: 'custrecord_ntx_cs_option_json',
                value: JSON.stringify({
                    'from_sku': recent_so_details[property]['from_sku'],
                    'to_sku': recent_so_details[property]['to_sku'],
                    'from_quan': recent_so_details[property]['from_quan'],
                    'to_quan': recent_so_details[property]['to_quan'],
                    'po_id': recent_so_details[property]['po_id']
                })
            });

            /*  customRecord.setValue({
                  fieldId: 'custrecord_ntx_cs_unique_key',
                  value: uniquenumber
              });*/
            customRecord.setValue({
                fieldId: 'custrecord_ntx_cs_lst_parent_so',
                value: recent_so_details[property]['custom_record_parent_id']
            });

            customRecord.save();
        }

        const sendEmail = (soId, sku_details, parentID) => {
            //store custom record, get id
            //create custom record, get id from here.
            //check for similar and disc
            let _type = (sku_details[Object.keys(sku_details)[0]]['_type']);
            let templateId = _type == XML_TYPE.SIMILAR ? EMAIL_TEMPLATE.SIMILAR : EMAIL_TEMPLATE.DISSIMILAR

            var EmailMergeResult = render.mergeEmail({
                templateId: templateId,

                transactionId: parseInt(soId)

            });

            var subject = EmailMergeResult.subject;
            var body = EmailMergeResult.body;
            body = constructBody(body, sku_details, _type);
            // throw JSON.stringify(sku_details);

            // customer_options(resp_id,sku_details)
            //body=
            let to_email = '';
            let _cc = [];
            log.debug('type', _type);
            if (_type == 1) {
                let disti_email = (sku_details[Object.keys(sku_details)[0]]['distributor_email']);
                let cm_email = (sku_details[Object.keys(sku_details)[0]]['cm_email']);
                let unique_key = (sku_details[Object.keys(sku_details)[0]]['uniquenumber']);

                _cc.push('fulfillment@nutanix.com');
                body = libCS.create_rej_link(unique_key, body)
                //throw body;
                if (cm_email) _cc.push(cm_email);
                //  log.debug('cc', _cc.toString());
                //  if (!disti_email) disti_email = cm_email;
                to_email = disti_email;
            } else {
                let cm_email = (sku_details[Object.keys(sku_details)[0]]['cm_email']);
                to_email = (sku_details[Object.keys(sku_details)[0]]['salesrep_email']);
                if (cm_email) _cc.push(cm_email);
            }
            log.debug('to_eamil', to_email);
            if (to_email) {
                libCS.TriggerHoldSignalFromSO(soId);
                email.send({
                    author: SENDER,
                    recipients: to_email,
                    cc: _cc,
                    subject: subject,
                    body: body,

                    relatedRecords: {
                        transactionId: soId
                    }
                });

                log.debug('email sent')
            }
            //send email
        }

        const getFilters = (arr_from_sku, __model) => {
            var searchFilters = [];
            /* searchFilters.push(["internalidnumber", "equalto", "18668146"]);
             searchFilters.push('AND');*/
            searchFilters.push(['mainline', 'is', 'F']);
            searchFilters.push('AND');
            searchFilters.push(["custrecord_ntx_cs_lst_salesorder.custrecord_ntx_cs_lst_current_status", "anyof", "1"]);
            searchFilters.push("AND");
            searchFilters.push(["custrecord_ntx_cs_lst_salesorder.isinactive", "is", "F"]);
            searchFilters.push("AND");

            let _filters = [];
            if (__model == true) {
                arr_from_sku.forEach(function(item_name) {

                    _filters.push(['item.name', 'startswith', item_name]);
                    _filters.push('OR');
                });
            } else {
                arr_from_sku.forEach(function(item_name) {

                    _filters.push(['item.name', 'is', item_name]);
                    _filters.push('OR');
                });
            }
            _filters.pop();
            searchFilters.push(_filters);


            return searchFilters;

        }
        return {getFilters,constructTable, getProperty,TriggerHoldSignalFromSO,create_rej_link,create_salesorderSearchObj,createChildRecords_for_similar}

    });
