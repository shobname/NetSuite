/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */

define(['N/search','N/record'],

    (search,record) => {
        const searchId =20115;
        const remove_po_from_so=(soid)=>{
            let soRec = record.load({
                type:'salesorder',
                id:soid
            })
            var salesorderSearchObj = search.create({
                type: "salesorder",
                filters:
                    [
                        ["type","anyof","SalesOrd"],
                        "AND",
                        ["internalidnumber","equalto",soid],
                        "AND",
                        ["purchaseorder.internalidnumber","isnotempty",""]
                    ],
                columns:
                    [
                        search.createColumn({name: "line", label: "Line ID"}),
                        search.createColumn({name: "purchaseorder", label: "Purchase Order"})
                    ]
            });
            var searchResultCount = salesorderSearchObj.runPaged().count;
            log.debug("salesorderSearchObj result count",searchResultCount);
            salesorderSearchObj.run().each(function(result){
                soRec.setSublistValue({sublistId : 'item',
                    fieldId : 'purchaseorder',
                    line : result.getValue('line'),
                    value: null
                });

                // .run().each has a limit of 4,000 results
                return true;
            });
            soRec.save();
        }
        const voidPO = (po_id)=>{

            var poRec = record.load({
                type: 'purchaseorder',
                id: po_id
            });
            var lineCount = poRec.getLineCount( {
                sublistId : 'item'
            });
            for (let i = 0; i < lineCount; i++) {


                poRec.setSublistValue({sublistId : 'item',
                    fieldId : 'isclosed',
                    line : i,
                    value: true
                });


            }

            poRec.setValue('voided',true);
            poRec.save();
        }

        const swapInSO= (soId,jsonData,lineID,xml_type)=>{
            let actual_LineId= parseInt(lineID)+1;
            let soRec = record.load({
                type:'salesorder',
                id:soId
            });
            /*
            * from_sku = {string} C-NIC-25GSFP2-A12
to_sku = {string} C-NIC-25G2B1
from_quan = {number} 4
to_quan = {number} 4
sf_req_id = {string} a340e000000G9ilAAC
sf_order_line_id = {string} a340e000000G9iqAAC
model = {string} NX-8155-G7-4214*/
let parseData = JSON.parse(jsonData);
let to_sku = parseData['to_sku'];
let to_quan = parseData['to_quan'];
            let model = parseData['model'];

            let _values = {
                "amount":'',
                "rate":'',
                "custcol_sf_order_required_by_line":'',
                "custcol_sf_order_line_id":'',
                "custcol_global_list_price":'',
                "custcol_list_amount":'',
                "custcol_ntnx_arm_rr_start_date":'',
                "custcol_ntnx_arm_rr_end_date":'',
                "quantity":'',
                "custcol_term_days":'',
                "custcol_term_months":''
            }
            for (const property in _values) {
                _values[property]= soRec.getSublistValue({sublistId:'item',fieldId:property,line:actual_LineId});
            }
let existingLineQuan= _values['quantity'];



            if(existingLineQuan != to_quan){
                let existingLineAmount= _values['amount'];
                let unitprice =parseFloat(existingLineAmount)/ parseFloat(existingLineQuan);
                _values['rate'] = unitprice;
                _values['quantity'] = to_quan;
            }
            soRec.removeLine({sublistId:'item',line:actual_LineId});

            soRec.insertLine({
                sublistId: 'item',
                line: actual_LineId,
            });

            soRec.setSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                value: 65414,
                line:actual_LineId
            });

            for (var property in _values) {
                soRec.setSublistValue({
                    sublistId: 'item',
                    fieldId: property,
                    value: _values[property],
                    line:actual_LineId
                });



            }
            soRec.save();



        }
        const execute = (scriptContext) => {

            var searchResult = search.load({
                id:searchId
            }).run();
            searchResult.each(function(result){
                var soId   =  result.getValue({
                    name: "custrecord_ntx_cs_lst_salesorder",
                    join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
                });
                var uniqueKey =  result.getValue({
                    name: "custrecord_ntx_cs_lst_uniquekey",
                    join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
                });
                var xmlType =  result.getValue({
                    name: "custrecord_ntx_cs_xml_type",
                    join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
                });
                var jsonData =  result.getValue({
                    name: "custrecord_ntx_cs_option_json"
                });
                var lineID =  result.getValue({
                    name: "custrecord_ntx_cs_so_line_id"
                });
                var parentID =  result.getValue({
                    name: "custrecord_ntx_cs_lst_parent_so",
                    sort: search.Sort.DESC,
                    label: "component swap salesorders"
                })


swapInSO(soId,jsonData,lineID,xmlType);


                return true;
            });


        }

        return {execute}

    });
