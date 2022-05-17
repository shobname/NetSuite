/**
 * @NApiVersion 2.1
 */
/*1.0       shobiya     april 21 2022       /BA-89159 component swap
 */
define(['N/search', 'N/record', 'N/url', 'N/render', 'N/format'],

    (search, record, url, render, format) => {

        const create_salesorderSearchObj = (fil) => {
            return search.create({
                type: "salesorder",
                //  id:so_list,
                 title: 'testing shobiya' + new Date(),
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
        const constructTable = (_mainbody) => {
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
                    'custbody_resend_order': true
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

        const getFilters = (arr_from_sku, __model, so_id) => {
            var searchFilters = [];
            if (so_id) {
                searchFilters.push(["internalidnumber", "equalto", so_id]);
                searchFilters.push('AND');
            }
            searchFilters.push(['mainline', 'is', 'F']);
            searchFilters.push('AND');
            searchFilters.push(["custrecord_ntx_cs_lst_salesorder.custrecord_ntx_cs_lst_current_status", "anyof", "1"]);
            searchFilters.push("AND");
            searchFilters.push(["custrecord_ntx_cs_lst_salesorder.isinactive", "is", "F"]);
            searchFilters.push("AND");

            let _filters = [];
            if (__model == true) {
                arr_from_sku.forEach(function (item_name) {

                    _filters.push(['item.name', 'startswith', item_name]);
                    _filters.push('OR');
                });
            } else {
                arr_from_sku.forEach(function (item_name) {
log.debug('itemname',item_name)
                    _filters.push(['item.name', 'is', item_name]);//
                    _filters.push('OR');
                });
            }
            _filters.pop();
            searchFilters.push(_filters);


            return searchFilters;

        }
        return {
            getFilters,
            constructTable,
            getProperty,
            TriggerHoldSignalFromSO,
            create_rej_link,
            create_salesorderSearchObj,
            createChildRecords_for_similar
        }

    });
