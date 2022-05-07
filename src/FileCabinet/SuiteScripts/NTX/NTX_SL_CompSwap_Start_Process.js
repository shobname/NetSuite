/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget','N/task'],
    
    (ui,task) => {

        const onRequest = (context) => {
            if (context.request.method === 'GET') {

                var form = ui.createForm({
                    title: 'Response Form'
                });
                var request = context.request;

                form.addSubmitButton({
                    id:'custpage_btn_startprocess',
                    label:'Start Swapping process'
                })
             //   form.clientScriptFileId = 18125554;
                context.response.writePage(form);
            }
            else{
                try {
                    let scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
                    scriptTask.scriptId = 'customscript_ntx_ss_compswap_main_proces';
                    scriptTask.deploymentId = 'customdeploy_ntx_ss_compswap_main_proces';
                    let __id = scriptTask.submit();
                    // the recipientEmail value with the appropriate email addresss.
                    let taskStatus = task.checkStatus(__id);
                    if (taskStatus.status === 'FAILED') {
                        log.error("FAILED", "Failed to submit task");

                        context.response.write('Batch had failed to start, please try agian');
                    } else {
                        context.response.write('Batch is started');
                    }

                }
                catch(e){
                    context.response.write('Error'+ e);
                }
            }


        }

        return {onRequest}

    });
