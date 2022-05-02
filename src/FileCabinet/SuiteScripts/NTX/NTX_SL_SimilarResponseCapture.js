/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
/*1.0       shobiya     april 21 2022       /BA-89159
* */
define(['N/search','N/record','N/format'],

    (search,record,format) => {
const updateCustomerResponse=(resp,uniqueKey)=>{
    var dt = format.format({
        value: new Date(),
        type: format.Type.DATETIME
    });
    var customrecord_ntx_cs_user_response_parentSearchObj = search.create({
        type: "customrecord_ntx_cs_user_response_parent",
        filters:
            [
                ["custrecord_ntx_cs_lst_uniquekey","equalto",uniqueKey]
               ,
                "AND",
                ["custrecord_ntx_cs_lst_customer_response","anyof","1"]
            ]
    });
    var searchResultCount = customrecord_ntx_cs_user_response_parentSearchObj.runPaged().count;
    log.debug("customrecord_ntx_cs_user_response_parentSearchObj result count",searchResultCount);
    if(searchResultCount ==0) return false;
    customrecord_ntx_cs_user_response_parentSearchObj.run().each(function(result){
        // .run().each has a limit of 4,000 results
      let parent_id=  result.id;

    record.submitFields({
        type:'customrecord_ntx_cs_user_response_parent',
        id:parent_id,
        values:{'custrecord_ntx_cs_lst_customer_response':3,
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
           // throw resp;
            let successful = updateCustomerResponse(resp,uniqueNum);
            let msg = successful?'Thankyou for your response, its recorded in the system.':'Response not recorded, this order is already swapped.please contact fulfillment@nutanix.com';

            context.response.write(msg);

        }

        return {onRequest}

    });
