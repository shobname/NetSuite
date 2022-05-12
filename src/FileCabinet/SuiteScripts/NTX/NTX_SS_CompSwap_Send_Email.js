/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
/*1.0       shobiya     april 21 2022       /BA-89159 component swap
 * */
/*
 * 1. both similar and dissimilar wontbe in same order
 * 2.unique so with ready status , email sent in custom record.
 * */
define(['N/xml', 'N/search', 'N/render', 'N/email', 'N/record', 'N/format', 'N/runtime', 'N/url', 'SuiteScripts/NTX/NTX_Lib_Swap.js'],

    (xml, search, render, email, record, format, runtime, url, libCS) => {

        // let SENDER = 3145069;
        let sku_details = {};
        let arr_from_sku = [];
        let arr_model_dissimilar = [];
        const XML_TYPE = {
            SIMILAR: 1,
            DISSIMILAR: 2
        }

        /* const getProperty = (propertyName, obj) => {

             if (!obj.hasOwnProperty(propertyName)) {
                 return null;
             }
             return parseInt(obj[propertyName]['currentkey']) + 1;
         }*/
        const execute = (scriptContext) => {

            sku_details = {};
            arr_from_sku = [];

            var customrecord_ntx_cs_swap_datatableSearchObj = search.create({
                type: "customrecord_ntx_cs_swap_datatable",
                filters: [
                    ["isinactive", "is", "F"] //, 'AND',
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
            log.debug('maindatacount', searchResultCount);

            if (searchResultCount > 0) {

                var searchResult = customrecord_ntx_cs_swap_datatableSearchObj.run().getRange({
                    start: 0,
                    end: searchResultCount
                });


                for (var k = 0; k < searchResultCount; k++) {
                    //log.debug('tes',k)
                    let result = searchResult[k];
                    let xmlString = result.getValue('custrecord_ntx_cs_xml_data'); //long text
                    let _type = result.getValue('custrecord_ntx_cs_type'); //long text
                    let _modelName = result.getValue('custrecord_ntx_cs_model'); //long text
                    constructData(xmlString, _type, _modelName, k);

                    //   log.debug('string',JSON.stringify(obj_model_sf_id));

                }
                let obj_model_sf_id = get_SfOrderLineId_For_Model();
                log.debug('data for ex', arr_model_dissimilar.toString() + "     " + JSON.stringify(obj_model_sf_id));
                //   throw JSON.stringify(sku_details);
                log.debug('arr_sku', arr_from_sku.toString());
                getSalesOrders_sendEmails(arr_from_sku, obj_model_sf_id); //send email for salesorders,
            }

        }
        const get_SfOrderLineId_For_Model = () => {
            let obj = {};
            if (arr_model_dissimilar && arr_model_dissimilar.length == 0) return obj;
            log.debug('arr_model_dissimilar', arr_model_dissimilar.toString());
            let fil =libCS.getFilters(arr_model_dissimilar, true);

            let salesorderSearchObj = libCS.create_salesorderSearchObj(fil);
            //  salesorderSearchObj.save();
            var searchResultCount = salesorderSearchObj.runPaged().count;
            log.debug('new sarch', searchResultCount);
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



                    let sf_order_line = result.getValue('custcol_sf_order_line_id');
                    obj[sf_order_line] = from_sku;

                }
            }

            return obj;
        }
        const constructData = (xmlString, _type, _modelName, k) => {
            var xmlDocument = xml.Parser.fromString({
                text: xmlString
            });


            var swapNode = xml.XPath.select({
                node: xmlDocument,
                xpath: '//SWAPXML'
            });
            // for (var i = 0; i < 1; i++) {
            for (var i = 0; i < swapNode.length; i++) {
                // log.debug('Config content', swapNode[i].textContent);
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
                if (_type == 1) {
                    sku_details[from_sku] = {
                        'from': from_sku,
                        'to': to_sku,
                        'to_quan': to_quan,
                        'from_quan': from_quan,
                        '_type': _type
                    }
                } else {
                    if (arr_model_dissimilar.indexOf(_modelName) == -1)
                        arr_model_dissimilar.push(_modelName);
                    let current_key = libCS.getProperty(from_sku, sku_details);
                    let _optionKey = 'option' + current_key;
                    if (!current_key) {
                        sku_details[from_sku] = {
                            '_type': _type,
                            'currentkey': 1,
                            'model': _modelName,
                            ['option' + 1]: {

                                'to': to_sku,
                                'to_quan': to_quan,
                                'from_quan': from_quan,
                                'from_sku': from_sku

                            }
                        }
                    } else {
                        sku_details[from_sku][_optionKey] = {
                            'to': to_sku,
                            'to_quan': to_quan,
                            'from_quan': from_quan,
                            'from_sku': from_sku
                        }
                    }

                }

                //  var f=0;
            }
        }
        const sendEmail = (soId, sku_details,custrec_parent_id) => {
            log.debug('obj to send',JSON.stringify(sku_details));
            var currScript = runtime.getCurrentScript();
            const EMAIL_TEMPLATE = {
                SIMILAR: currScript.getParameter({
                    name: 'custscript_ntx_cs_sim_templ'
                }),//4100,
                DISSIMILAR: currScript.getParameter({
                    name: 'custscript_ntx_cs_dissim_templ'
                })
            }

            const SENDER = currScript.getParameter({
                name: 'custscript_ntx_cs_mail_sender'
            });


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
            _cc.push('fulfillment@nutanix.com');
            _cc.push('nutanix2sales@supermicro.com');
            log.debug('type', _type);
            if (_type == 1) {
                let disti_email = (sku_details[Object.keys(sku_details)[0]]['distributor_email']);
                let cm_email = (sku_details[Object.keys(sku_details)[0]]['cm_email']);
                let unique_key = (sku_details[Object.keys(sku_details)[0]]['uniquenumber']);


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

            log.debug('email', to_email);
            log.debug('so to send email',soId);
            if (to_email) {
                libCS.TriggerHoldSignalFromSO(soId);
                email.send({
                    author: SENDER,
                    recipients: to_email,
                    cc: _cc,
                    subject: subject,
                    body: body,

                    relatedRecords: {
                        transactionId: soId,
                        customRecord:{
                            id:'customrecord_ntx_cs_user_response_parent',
                            recordType: custrec_parent_id //an integer value
                        }
                    }
                });

                log.debug('email sent',soId);
            }
            //send email
        }


        const createChildRecord_Dissimilar = (soid, recent_so_details, property, uniquenumber, i) => {
            let sf_order_line_id = recent_so_details[Object.keys(recent_so_details)[0]]['sf_order_line'];
            let sf_req_id = recent_so_details[Object.keys(recent_so_details)[0]]['sf_required_line'];
            let _model = recent_so_details[Object.keys(recent_so_details)[0]]['model'];
            log.debug('while', recent_so_details[property]['option' + i]);
            let _optionDetails = recent_so_details[property]['option' + i];
            let po_id = recent_so_details[Object.keys(recent_so_details)[0]]['po_id'];
            let toSKU = _optionDetails['option' + i]['to'];
            let fromSKU = _optionDetails['option' + i]['from_sku'];
            let from_quan = _optionDetails['option' + i]['from_quan'];
            let to_quan = _optionDetails['option' + i]['to_quan'];
            let ratio = parseInt(to_quan) / parseInt(from_quan);

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
                value: fromSKU
            });
            customRecord.setValue({
                fieldId: 'custrecord_ntx_cs_model_name',
                value: _model
            });

            customRecord.setValue({
                fieldId: 'custrecord_ntx_cs_option_json',
                value: JSON.stringify({
                    'from_sku': fromSKU,
                    'to_sku': toSKU,
                    'po_id': po_id,
                    'from_quan': from_quan,
                    'to_quan': to_quan,
                    'sf_req_id': sf_req_id,
                    'sf_order_line_id': sf_order_line_id,
                    'model': _model
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

            let __id = customRecord.save();
            return __id;
        }
        const createErrorMsg =(parentid,__type)=>{
            record.submitFields({
                type: 'customrecord_ntx_cs_user_response_parent',
                id: parentid,
                values: {

                    'custrecord_ntx_cs_xml_type': __type,
                    'custrecord_ntx_cs_lst_current_status': 5,
                    'custrecord_ntx_cs_error_log':'To email does not exist'

                }
            });
        }
        const createWaitForResponse = (soid, recent_so_details,custom_record_parent_id) => {


            log.debug('json', JSON.stringify(recent_so_details));
            let __type = (recent_so_details[Object.keys(recent_so_details)[0]]['_type']);
            let uniquenumber = new Date().getTime();
            if (__type == 1) {
                for (const property in recent_so_details) {
                    libCS.createChildRecords_for_similar(soid, recent_so_details, property);


                    recent_so_details[property]['uniquenumber'] = uniquenumber;

                }
            } else {
                let property = ([Object.keys(recent_so_details)[0]]);


                let i = 1;

                while (recent_so_details[property]['option' + i]) {
                    let __id = createChildRecord_Dissimilar(soid, recent_so_details, property, uniquenumber, i);
                    log.debug('childid', __id);
                    let __option = recent_so_details[property]['option' + i];
                    __option['option' + i]['childid'] = __id;

                    i++;
                }
                recent_so_details[property]['uniquenumber'] = uniquenumber;


            }
            var dt = format.format({
                value: new Date(),
                type: format.Type.DATETIME
            });
            // let __type = (recent_so_details[Object.keys(recent_so_details)[0]]['_type']);
            let parentid = (recent_so_details[Object.keys(recent_so_details)[0]]['custom_record_parent_id']);
            record.submitFields({
                type: 'customrecord_ntx_cs_user_response_parent',
                id: parentid,
                values: {
                    'custrecord_ntx_cs_lst_uniquekey': uniquenumber,
                    'custrecord_ntx_cs_dt_email_sent_on': dt,
                    'custrecord_ntx_cs_xml_type': __type,
                    'custrecord_ntx_cs_lst_current_status': 2
                }
            });

            sendEmail(soid, recent_so_details, custom_record_parent_id);

            return recent_so_details;
        }
        const constructBody = (body, sku_details, _type) => {
            if (_type == 1) {
                var _mainbody = '';

                _mainbody = libCS.constructTable(_mainbody);
                for (const property in sku_details) {

                    _mainbody +=
                        '  <tr>\n' +

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
            } else {
                var _mainbody = '';
                //  throw JSON.stringify(sku_details);
                for (const property in sku_details) {
                    let i = 1;



                    let property = ([Object.keys(sku_details)[0]]);

                    while (sku_details[property]['option' + i]) {
                        let _optionDetails = sku_details[property]['option' + i];

                        let so_from_quan = _optionDetails['option' + i]['so_from_quan'];
                        let from_quan_template = _optionDetails['option' + i]['from_quan'];
                        let to_quan_template = _optionDetails['option' + i]['to_quan'];
                        let _to_quan = parseInt(to_quan_template) / parseInt(from_quan_template) * parseInt(so_from_quan)
                        _mainbody += '<h3>Option ' + i + '</h3>';
                        _mainbody = libCS.constructTable(_mainbody);
                        _mainbody +=
                            '  <tr>\n' +

                            '    <td class="borderclass">' + _optionDetails['option' + i]['from_sku'] + '</td>\n' +
                            '    <td class="borderclass">' + so_from_quan + '</td>\n' +
                            '    <td class="borderclass">' + _optionDetails['option' + i]['to'] + '</td>\n' +
                            '    <td class="borderclass">' + _to_quan + '</td>\n' +

                            '  </tr>\n';

                        _mainbody += '</table><br>';
                        i++;

                    }


                }
                //replace suitlet link
                //loop sku_details, replace ##SIMILAR_TABLE

                //create custom record

                let unique_key = (sku_details[Object.keys(sku_details)[0]]['uniquenumber']);

                let suiteletURLOutput = url.resolveScript({
                    scriptId: 'customscript_ntx_sl_dissimilar_response',
                    deploymentId: 'customdeploy_ntx_sl_dissimilar_response',
                    returnExternalUrl: true,
                    params: {

                        unique_key: unique_key

                    }
                });

                body = body.replace('##popup_link##', suiteletURLOutput);
                body = body.replace('##DISSIMILAR_TABLE##', _mainbody);
                return body;
            }
        }


        const getSalesOrders_sendEmails = (arr_from_sku, obj_model_sf_id) => {
            let fil = libCS.getFilters(arr_from_sku);


            let salesorderSearchObj = libCS.create_salesorderSearchObj(fil);

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

                    let po_id = result.getValue('purchaseorder');
                    let sf_order_line = result.getValue('custcol_sf_order_line_id');
                    let sf_required_line = result.getValue('custcol_sf_order_required_by_line');
                    let custom_record_parent_id = result.getValue({
                        name: "internalid",
                        join: "CUSTRECORD_NTX_CS_LST_SALESORDER"

                    });
                    let disti_email = result.getValue('custbody_disti_email_address');
                    let salesrepEmail = result.getValue({
                        name: "email",
                        join: "custbody14"
                    });
                    log.debug('salesrepema', salesrepEmail);
                    let from_quan = result.getValue('quantity');



                    let _type = sku_details[from_sku]['_type'];

                    let to_sku = sku_details[from_sku]['to'];
                    let to_quan_template = sku_details[from_sku]['to_quan']; //result.getValue('quantity');//sku_details
                    let from_quan_template = sku_details[from_sku]['from_quan'];
                    let model = sku_details[from_sku]['model'];
                    log.audit('parent id', custom_record_parent_id);

                    if (recent_so == null) recent_so = soId;
                    if (recent_so == soId) {

                        if ((_type == 1 && !disti_email ) || (_type ==2 && !salesrepEmail)){
                            createErrorMsg(custom_record_parent_id,_type);
                            continue;
                        }

                        let to_quan = parseInt(to_quan_template) / parseInt(from_quan_template) * parseInt(from_quan);
                        recent_so_details[line_id] = {
                            'custom_record_parent_id': custom_record_parent_id,
                            '_type': _type,
                            'line_id': line_id,
                            "soId": recent_so,
                            "from_sku": from_sku,
                            "to_sku": to_sku,
                            "from_quan": from_quan,
                            "to_quan": to_quan,
                            "po_id": po_id,
                            "distributor_email": result.getValue('custbody_disti_email_address'),
                            "cm_email": result.getValue({
                                name: "email",
                                join: "CUSTBODY_SEND_XML_TO"
                            })
                        }
                    } else {

                        recent_so_details[line_id] = {
                            'custom_record_parent_id': custom_record_parent_id,
                            '_type': _type,
                            'line_id': line_id,
                            "soId": recent_so,
                            "model": model,
                            "po_id": po_id,
                            "sf_order_line": sf_order_line,
                            "sf_required_line": sf_required_line,
                            "salesrep_email": salesrepEmail
                        }
                        recent_so_details = setOptions(line_id, recent_so_details, sku_details[from_sku], from_quan);

                    }

                    if (searchResultCount == (i + 1)) { //send for last record, and if only salesorder
                        if (_type != 1) {
                            //check here if model matching with sku
                            let exist = checkModel_Exist_in_SO(obj_model_sf_id, recent_so_details);
                            log.debug('model exist?', exist);
                            if (!exist) continue;
                        }
                        if ((_type == 1 && !disti_email ) || (_type ==2 && !salesrepEmail)) {
                            createErrorMsg(custom_record_parent_id,_type);

                            continue;

                        }

                        recent_so_details = createWaitForResponse(recent_so, recent_so_details, custom_record_parent_id);

                        //  sendEmail(soId, recent_so_details, custom_record_parent_id);

                    }


                    else if (recent_so != soId) {
                        //send email for prev so number
                        //check model number
                        if (_type != 1) {
                            let exist = checkModel_Exist_in_SO(obj_model_sf_id, recent_so_details);
                            log.debug('model exist?', exist);
                            if (!exist) continue;
                        }
                        if((_type ==1 && !disti_email) || (_type ==2 && !salesrepEmail)){
                            //store in parent
                            createErrorMsg(custom_record_parent_id,_type);
                            continue;
                        }
                        recent_so_details = createWaitForResponse(recent_so, recent_so_details, custom_record_parent_id);
                        //  sendEmail(recent_so, recent_so_details, custom_record_parent_id);
                        recent_so = soId;
                        recent_so_details = {};
                        if (_type == 1) {
                            let to_quan = parseInt(to_quan_template) / parseInt(from_quan_template) * parseInt(from_quan)
                            recent_so_details[line_id] = {
                                'custom_record_parent_id': custom_record_parent_id,
                                '_type': _type,
                                "soId": recent_so,
                                "from_sku": from_sku,
                                "to_sku": to_sku,
                                "po_id": po_id,
                                "from_quan": from_quan,
                                "to_quan": to_quan,
                                "distributor_email": result.getValue('custbody_disti_email_address'),
                                "cm_email": result.getValue({
                                    name: "email",
                                    join: "CUSTBODY_SEND_XML_TO"
                                })
                            }
                        } else {
                            //here check for the model and remove
                            let model = sku_details[from_sku]['model'];
                            recent_so_details[line_id] = {
                                'custom_record_parent_id': custom_record_parent_id,
                                '_type': _type,
                                'line_id': line_id,
                                "soId": recent_so,
                                "model": model,
                                "po_id": po_id,
                                "sf_order_line": sf_order_line,
                                "sf_required_line": sf_required_line,
                                "salesrep_email": salesrepEmail
                            }
                            recent_so_details = setOptions(line_id, recent_so_details, sku_details[from_sku], from_quan);

                        }

                    }


                    //send email
                    //   return true;
                    // });
                }
            }
        }
        const checkModel_Exist_in_SO = (obj_model_sf_id, recent_so_details) => {

            if (Object.keys(obj_model_sf_id).length == 0) return false;

            let sf_req_line = recent_so_details[Object.keys(recent_so_details)[0]]['sf_required_line'];
            let modelName = recent_so_details[Object.keys(recent_so_details)[0]]['model']; //could be small
            let so_modelName = obj_model_sf_id[sf_req_line];
            if (!so_modelName) {
                log.error('model does not exist in so', sf_req_line + "--" + modelName + "--" + JSON.stringify(recent_so_details));
                return false;
            } else if (so_modelName.toString().toUpperCase().indexOf(modelName.toString().toUpperCase()) > -1) return true;

            return false;
        }




        const setOptions = (line_id, recent_so_details, sku_details, from_quan) => {
            let i = 1;
            while (sku_details['option' + i]) {
                recent_so_details[line_id]['option' + i] = {
                    ['option' + i]: sku_details['option' + i]
                }

                let __option = recent_so_details[line_id]['option' + i];
                __option['option' + i]['so_from_quan'] = from_quan; //but not storing it, used only for calc
                i++;
            }
            return recent_so_details;
        }


        return {
            execute
        }

    });