/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
/*1.0       shobiya     april 21 2022       /BA-89159 component swap
 * */
define(['N/xml', 'N/search', 'N/render', 'N/email', 'N/record', 'N/format', 'N/runtime', 'N/url'],

    (xml, search, render, email, record, format, runtime, url) => {
        let SENDER = 3145069;
        let sku_details = {};
        let arr_from_sku = [];
        const XML_TYPE = {
            SIMILAR: 1,
            DISSIMILAR: 2
        }
        const EMAIL_TEMPLATE = {
            SIMILAR: 4588,
            DISSIMILAR: 4589
        }
        const getProperty =  (propertyName,obj)=> {
            log.debug('obj.hasOwnProperty(propertyName)',obj.hasOwnProperty(propertyName));
            log.debug('propertyName',propertyName);
         if(!obj.hasOwnProperty(propertyName)){
             return null;
         }
            return obj[propertyName];
        }
        const execute = (scriptContext) => {

            sku_details = {};
            arr_from_sku = [];

            var customrecord_ntx_cs_swap_datatableSearchObj = search.create({
                type: "customrecord_ntx_cs_swap_datatable",
                filters: [
                    ["isinactive", "is", "F"]//, 'AND',
                   // ["custrecord_ntx_cs_type", "is", XML_TYPE.DISSIMILAR]
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_ntx_cs_type",
                        label: "Type"
                    }),
                    search.createColumn({
                        name: "custrecord_ntx_cs_xml_data",
                        label: "Xml data"
                    }),
                    search.createColumn({
                        name: "custrecord_ntx_cs_model",
                        label: "Model"
                    })
                ]
            });

            var searchResultCount = customrecord_ntx_cs_swap_datatableSearchObj.runPaged().count;
log.debug('maindatacount',searchResultCount);

            if (searchResultCount > 0) {

                var searchResult = customrecord_ntx_cs_swap_datatableSearchObj.run().getRange({
                    start: 0,
                    end: searchResultCount
                });


                for (var k = 0; k < searchResultCount; k++) {
                    log.debug('tes',k)
let result=searchResult[k]
                    let xmlString = result.getValue('custrecord_ntx_cs_xml_data'); //long text
                    let _type = result.getValue('custrecord_ntx_cs_type'); //long text
                    let _modelName = result.getValue('custrecord_ntx_cs_model'); //long text
                    constructData(xmlString, _type, _modelName, k);


                }
                throw JSON.stringify(sku_details);
                log.debug('arr_sku', arr_from_sku.toString());
                getSalesOrders_sendEmails(arr_from_sku); //send email for salesorders,
            }

        }
        const constructData = (xmlString, _type,_modelName,k) => {
            var xmlDocument = xml.Parser.fromString({
                text: xmlString
            });


            var swapNode = xml.XPath.select({
                node: xmlDocument,
                xpath: '//SWAPXML'
            });
            // for (var i = 0; i < 1; i++) {
            for (var i = 0; i < swapNode.length; i++) {
                log.debug('Config content', swapNode[i].textContent);
                var from_sku = xml.XPath.select({
                    node: xmlDocument,
                    xpath: '//FROMSKU'
                })[i].textContent;
                var from_quan = xml.XPath.select({
                    node: xmlDocument,
                    xpath: '//FROMQuantity'
                })[i].textContent;

                var to_sku = xml.XPath.select({
                    node: xmlDocument,
                    xpath: '//TOSKU'
                })[i].textContent;

                var to_quan = xml.XPath.select({
                    node: xmlDocument,
                    xpath: '//TOQUANTITY'
                })[i].textContent;

                arr_from_sku.push(from_sku);
                if(_type==1) {
                    sku_details[from_sku] = {
                        'from': from_sku,
                        'to': to_sku,
                        'to_quan': to_quan,
                        'from_quan': from_quan,
                        '_type': _type
                    }
                }
                else {
                    let _optionKey = 'option' + k;
                  let new_sku_details = getProperty(from_sku, sku_details);
                    if (!new_sku_details){
                        sku_details[from_sku] = {
                            '_type': _type,
                            model: _modelName,
                            [_optionKey]: {

                                'to': to_sku,
                                'to_quan': to_quan,
                                'from_quan': from_quan

                            }
                        }
                }
                    else{
                        sku_details[from_sku][_optionKey]={
                            'to': to_sku,
                            'to_quan': to_quan,
                            'from_quan': from_quan
                        }
                    }

                }

                //  var f=0;
            }
        }
        const sendEmail = (soId, sku_details) => {
            //store custom record, get id
            //create custom record, get id from here.
            var EmailMergeResult = render.mergeEmail({
                templateId: EMAIL_TEMPLATE.SIMILAR,

                transactionId: parseInt(soId)

            });

            var subject = EmailMergeResult.subject;
            var body = EmailMergeResult.body;
            body = constructBody(body, sku_details);
            // throw JSON.stringify(sku_details);

            // customer_options(resp_id,sku_details)
            //body=
            let disti_email = (sku_details[Object.keys(sku_details)[0]]['distributor_email']);
            let cm_email = (sku_details[Object.keys(sku_details)[0]]['cm_email']);
            let unique_key = (sku_details[Object.keys(sku_details)[0]]['uniquenumber']);
            let _cc = ['fulfillment@nutanix.com'];
            body = create_rej_link(unique_key, body)
            //throw body;
            if (cm_email) _cc.push(cm_email);
            log.debug('cc', _cc.toString());
            if (!disti_email) disti_email = cm_email;
            if (disti_email) {

                email.send({
                    author: SENDER,
                    recipients: disti_email,
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


        const createWaitForResponse = (soid, recent_so_details) => {



            let uniquenumber = new Date().getTime();
            for (const property in recent_so_details) {


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
                    fieldId: 'custrecord_ntx_cs_option_json',
                    value: {
                        'from_sku': recent_so_details[property]['from_sku'],
                        'to_sku': recent_so_details[property]['to_sku'],
                        'from_quan': recent_so_details[property]['from_quan'],
                        'to_quan': recent_so_details[property]['to_sku']
                    }
                });

                customRecord.setValue({
                    fieldId: 'custrecord_ntx_cs_unique_key',
                    value: uniquenumber
                });
                customRecord.setValue({
                    fieldId: 'custrecord_ntx_cs_lst_parent_so',
                    value: recent_so_details[property]['custom_record_parent_id']
                });

                customRecord.save();
                recent_so_details[property]['uniquenumber'] = uniquenumber;

            }

            var dt = format.format({
                value: new Date(),
                type: format.Type.DATETIME
            });
            let __type = (recent_so_details[Object.keys(recent_so_details)[0]]['_type']);
            let parentid = (recent_so_details[Object.keys(recent_so_details)[0]]['custom_record_parent_id']);;
            record.submitFields({
                type: 'customrecord_ntx_cs_user_response_parent',
                id: parentid,
                values: {
                    'custrecord_ntx_cs_lst_uniquekey': uniquenumber,
                    'custrecord_ntx_cs_dt_email_sent_on': dt,
                    'custrecord_ntx_cs_xml_type': __type
                }
            });
            return recent_so_details;

        }

        const constructBody = (body, sku_details) => {
            var _mainbody = '';

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
                //   '    <th class="borderclass">SO NUMBER link</th>\n' +
                '    <th class="borderclass">OLD COMPONENT</th>\n' +
                '    <th class="borderclass">QUANTITY</th> \n' +
                '    <th class="borderclass">NEW COMPONENT</th>\n' +

                '    <th class="borderclass">QUANTITY</th>\n' +

                '  </tr></thead>\n';
            for (const property in sku_details) {

                _mainbody +=
                    '  <tr>\n' +
                    //    '    <td class="borderclass">' +"test" +'</td>\n' +
                    '    <td class="borderclass">' + sku_details[property]['from_sku'] + '</td>\n' +
                    '    <td class="borderclass">' + sku_details[property]['from_quan'] + '</td>\n' +
                    '    <td class="borderclass">' + sku_details[property]['to_sku'] + '</td>\n' +
                    '    <td class="borderclass">' + sku_details[property]['to_quan'] + '</td>\n' +

                    '  </tr>\n';

            }

            //loop sku_details, replace ##SIMILAR_TABLE
            _mainbody += '</table>';
            //create custom record
            body = body.replace('##SIMILAR_TABLE##', _mainbody);
            return body;
        }
        const getFilters = (arr_from_sku) => {
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
            arr_from_sku.forEach(function(item_name) {

                _filters.push(['item.name', 'is', item_name]);
                _filters.push('OR');
            });
            _filters.pop();
            searchFilters.push(_filters);


            return searchFilters;

        }


        const getSalesOrders_sendEmails = (arr_from_sku) => {
            let fil = getFilters(arr_from_sku);
            var currScript = runtime.getCurrentScript();
            //  var so_list = currScript.getParameter({name: 'custscript_ntx_list_process_order'});


            var salesorderSearchObj = search.create({
                type: "salesorder",
                //  id:so_list,
                title: 'testing' + new Date(),
                filters: fil,
                columns: [
                    search.createColumn({
                        name: "item",
                        label: "Item"
                    }),
                    search.createColumn({
                        name: "line",
                        label: "Line ID"
                    }),
                    search.createColumn({
                        name: "custcol_sf_order_required_by_line",
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
                        join: "salesRep",
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
            //  salesorderSearchObj.save();
            var searchResultCount = salesorderSearchObj.runPaged().count;
            log.debug("salesorderSearchObj result count", searchResultCount);
            let recent_so = null;
            let recent_so_details = {};

            if (searchResultCount > 0) {

                var searchResult = salesorderSearchObj.run().getRange({
                    start: 0,
                    end: searchResultCount
                });


            for (var i = 0; i < searchResultCount; i++) {

                let result = searchResult[i];
                //}
                //  salesorderSearchObj.run().each(function(result) {
                let from_sku = result.getText('item');


                let soId = result.id;
                let line_id = result.getValue('line');
let salesrepEmail=result.getValue({
    name: "email",
    join: "salesRep",
    label: "Email"
});
                let from_quan = result.getValue('quantity');


                let to_sku = sku_details[from_sku]['to'];
                let _type = sku_details[from_sku]['_type'];

                let to_quan_template = sku_details[from_sku]['to_quan']; //result.getValue('quantity');//sku_details
                let from_quan_template = sku_details[from_sku]['from_quan'];
                let to_quan =parseInt(to_quan_template)/parseInt(from_quan_template) * parseInt(from_quan)
                let custom_record_parent_id = result.getValue({
                    name: "internalid",
                    join: "CUSTRECORD_NTX_CS_LST_SALESORDER"

                });
                log.audit('parent id', custom_record_parent_id);
                if (recent_so == null) recent_so = soId;
                if (recent_so == soId) {
                    recent_so_details[line_id] = {
                        'custom_record_parent_id': custom_record_parent_id,
                        '_type': _type,
                        'line_id': line_id,
                        "soId": soId,
                        "from_sku": from_sku,
                        "to_sku": to_sku,
                        "from_quan": from_quan,
                        "to_quan": to_quan,
                        "distributor_email": result.getValue('custbody_disti_email_address'),
                        "cm_email": result.getValue({
                            name: "email",
                            join: "CUSTBODY_SEND_XML_TO"
                        })
                    }
                    log.debug('storing records')
                    if (searchResultCount == (i + 1)) {
                        log.debug('sending email');
                        recent_so_details = createWaitForResponse(soId, recent_so_details, custom_record_parent_id);


                        sendEmail(recent_so, recent_so_details);
                    }

                } else if (recent_so != soId) {
                    //send email for prev so number
                    recent_so_details = createWaitForResponse(soId, recent_so_details, custom_record_parent_id);


                    sendEmail(recent_so, recent_so_details);
                    recent_so = soId;
                    recent_so_details = {};
                    recent_so_details[line_id] = {
                        'custom_record_parent_id': custom_record_parent_id,
                        '_type': _type,
                        "soId": soId,
                        "from_sku": from_sku,
                        "to_sku": to_sku,
                        "from_quan": from_quan,
                        "to_quan": to_quan,
                        "distributor_email": result.getValue('custbody_disti_email_address'),
                        "cm_email": result.getValue({
                            name: "email",
                            join: "CUSTBODY_SEND_XML_TO"
                        })
                    }

                }


                //send email
                //   return true;
                // });
            }
        }
        }

        return {
            execute
        }

    });


/*require(['N/xml'],
    function(xml){
        function process(){

            var xmlString = "<SWAPXML><FROM><FROMXML><FROMSKU>C-NIC-25GSFP2-A</FROMSKU><FROMQuantity>1</FROMQuantity></FROMXML></FROM><TO><TOXML><TOSKU>C-NIC-25G2A1</TOSKU><TOQUANTITY>1</TOQUANTITY></TOXML></TO></SWAPXML>";

            var xmlDocument = xml.Parser.fromString({
                text: xmlString
            });
            var fromNode = xml.XPath.select({
                node: xmlDocument,
                xpath: '//FROMXML'
            });

            var toNode = xml.XPath.select({
                node: xmlDocument,
                xpath: '//TOXML'
            });

            var test = xml.XPath.select({
                node: xmlDocument,
                xpath: '//SWAPXML'
            });

            for (var i = 0; i < test.length; i++) {
                log.debug('Config content', test[i].textContent);
                var from_sku = xml.XPath.select({
                    node: xmlDocument,
                    xpath: '//FROMSKU'
                })[i].textContent;
                var from_quan = xml.XPath.select({
                    node: xmlDocument,
                    xpath: '//FROMQuantity'
                })[i].textContent;
                var to_sku = xml.XPath.select({
                    node: xmlDocument,
                    xpath: '//TOSKU'
                })[i].textContent;

                var to_quan = xml.XPath.select({
                    node: xmlDocument,
                    xpath: '//TOQUANTITY'
                })[i].textContent;

                var f=0;
            }

            for (var i = 0; i < fromNode.length; i++) {
                log.debug('Config content', fromNode[i].textContent);
                var from_sku = xml.XPath.select({
                    node: xmlDocument,
                    xpath: '//FROMSKU'
                })[i].textContent;
                var from_quan = xml.XPath.select({
                    node: xmlDocument,
                    xpath: '//FROMQuantity'
                })[i].textContent;


                var f=0;
            }
            for (var i = 0; i < toNode.length; i++) {
                log.debug('Config content', toNode[i].textContent);


                var to_sku = xml.XPath.select({
                    node: xmlDocument,
                    xpath: '//TOSKU'
                })[i].textContent;

                var to_quan = xml.XPath.select({
                    node: xmlDocument,
                    xpath: '//TOQUANTITY'
                })[i].textContent;
                var f=0;
            }


            var gg=0
        }
        process();
    });*/