/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([],
    
    () => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const data =()=>{
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
        const getResultsFromUniqueKey=(unique_key)=>{
            var customrecord_ntx_cs_user_response_parentSearchObj = search.create({
                type: "customrecord_ntx_cs_user_response_parent",
                filters:
                    [
                        ["custrecord_ntx_cs_lst_uniquekey","equalto",unique_key]
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
            var searchResultCount = customrecord_ntx_cs_user_response_parentSearchObj.runPaged().count;
            log.debug('count',searchResultCount);
            return customrecord_ntx_cs_user_response_parentSearchObj;
        }
        const onRequest = (context) => {
//get custom parent id,

            var request = context.request;

         //   var resp = request.parameters.resp;
            var unique_key = request.parameters.unique_key;

            //context.response.write('Thankyou for your response, its recorded in system');
            //get child record and display options here.
         let customrecord_ntx_cs_user_response_parentSearchObj = getResultsFromUniqueKey(unique_key);

            customrecord_ntx_cs_user_response_parentSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                let option_internalid =result.getValue({
                    name: "internalid",
                    join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
                })
                let options_json = result.getValue({
                    name: "custrecord_ntx_cs_option_json",
                    join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
                });

                return true;
            });


        }

        return {onRequest}

    });
