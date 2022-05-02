/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/*
* throw error if sames so, in ready status*/
define(['N/search'],
    
    (search) => {
const SoExist=(soid)=>{
    var customrecord_ntx_cs_user_response_parentSearchObj = search.create({
        type: "customrecord_ntx_cs_user_response_parent",
        filters:
            [
                ["custrecord_ntx_cs_lst_salesorder.internalidnumber","equalto",soid],
                "AND",
                ["custrecord_ntx_cs_lst_current_status","anyof","1","2","3"],
                "AND",
                ["custrecord_ntx_cs_lst_salesorder.mainline","is","T"]
            ]
    });
    var searchResultCount = customrecord_ntx_cs_user_response_parentSearchObj.runPaged().count;
    if(searchResultCount >0){
        return true;
    }
    return false;
}
        const beforeSubmit = (scriptContext) => {
        if(scriptContext.mode == 'create' || scriptContext.mode == 'copy') {
         //   if(1==1){
              let newRec = scriptContext.newRecord;
              let soid = newRec.getValue('custrecord_ntx_cs_lst_salesorder');

              if (SoExist(soid)) throw "Salesorder already exist in table, please wait till it gets processed.";
              return true;
          }
        }



        return { beforeSubmit}

    });
