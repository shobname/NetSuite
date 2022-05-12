/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
/*1.0       shobiya     april 21 2022       /BA-89159
* */
define(['N/search','N/record','N/format'],

    (search,record,format) => {
const updateCustomerResponse=(resp,uniqueKey)=>{
    log.debug('response',resp);
    var dt = format.format({
        value: new Date(),
        type: format.Type.DATETIME
    });
    var customrecord_ntx_cs_user_response_parentSearchObj = search.create({
        type: "customrecord_ntx_cs_user_response_parent",
        //title:'shobiya test',
        filters:
            [
                ["custrecord_ntx_cs_lst_uniquekey","equalto",uniqueKey],
                "AND",
                ["custrecord_ntx_cs_lst_current_status","anyof","2"],
                "AND",
                ["isinactive","is","F"],
                "AND",
                ["custrecord_ntx_cs_lst_parent_so.isinactive","is","F"]
            ],
        columns:
            [
                search.createColumn({
                    name: "internalid",
                    join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
                })
            ]
    });
  //  customrecord_ntx_cs_user_response_parentSearchObj.save();
  //throw  customrecord_ntx_cs_user_response_parentSearchObj.save("test");
    var searchResultCount = customrecord_ntx_cs_user_response_parentSearchObj.runPaged().count;
    log.debug("customrecord_ntx_cs_user_response_parentSearchObj result count",searchResultCount);
  //  throw searchResultCount;
    if(searchResultCount ==0) return false;
    customrecord_ntx_cs_user_response_parentSearchObj.run().each(function(result){
        // .run().each has a limit of 4,000 results
        log.debug('es',resp)
        if(resp =='approve'){
        let child_id =  result.getValue({
            name: "internalid",
            join: "CUSTRECORD_NTX_CS_LST_PARENT_SO"
        })
            log.debug('sd',child_id);
        record.submitFields({
            type:'customrecord_ntx_cs_user_response',
            id:child_id,
            values:{ 'custrecord_ntx_cs_selected_by_user': true}
        })}
      let parent_id=  result.id;


    record.submitFields({
        type:'customrecord_ntx_cs_user_response_parent',
        id:parent_id,
        values:{'custrecord_ntx_cs_lst_current_status':3,

            'custrecord_ntx_cs_lst_customer_response':resp =='approve'? 1:2,
            'custrecord_ntx_cs_dt_response_received':dt}
    })
     //   return true;
    });
    return true;
}
        const onRequest = (context) => {
            var request = context.request;

            var resp = request.parameters.resp;
            var uniqueNum = request.parameters.lineId;

            let successful = updateCustomerResponse(resp,uniqueNum);
            let msg = successful?'Thankyou for your response, its recorded in the system.':'Response not recorded, this order is already swapped.please contact fulfillment@nutanix.com';

            context.response.write(msg);

        }

        return {onRequest}

    });
