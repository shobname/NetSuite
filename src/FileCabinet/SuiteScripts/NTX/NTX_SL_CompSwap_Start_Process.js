/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
/*1.0       shobiya     april 21 2022       /BA-89159 component swap
 */

define(['N/ui/serverWidget', 'N/task'],

    (ui, task) => {

        const onRequest = (context) => {
            if (context.request.method === 'GET') {

                var form = ui.createForm({
                    title: 'Component Swap Process'
                });

                form.addSubmitButton({
                    id: 'custpage_btn_startprocess',
                    label: 'Start Sending Email'
                })
                //   form.clientScriptFileId = 18125554;
                context.response.writePage(form);
            } else {
                try {
                    let scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
                    scriptTask.scriptId = 'customscript_ntx_ss_cp_sendemail';
                    scriptTask.deploymentId = 'customdeploy_ntx_ss_cp_sendemail';
                    let __id = scriptTask.submit();
                    // the recipientEmail value with the appropriate email addresss.
                    let taskStatus = task.checkStatus(__id);
                    if (taskStatus.status === 'FAILED') {
                        log.error("FAILED", "Failed to submit task");

                        context.response.write('Batch had failed to start, please try agian');
                    } else {
                        context.response.write('Batch is started');
                    }

                } catch (e) {
                    context.response.write('Error' + e);
                }
            }


        }

        return {onRequest}

    });
