import { LightningElement, track } from 'lwc';
import GetCaseById from '@salesforce/apex/CaseManagerClient.GetCaseById';
import NewCase from '@salesforce/apex/CaseManagerClient.NewCase';
import UpdateCase from '@salesforce/apex/CaseManagerClient.UpdateCase';
import DeleteCase from '@salesforce/apex/CaseManagerClient.DeleteCase';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LightningConfirm from 'lightning/confirm';

export default class Orgintegration extends LightningElement {
    @track Cases=[];
    @track NewModal=false;
    @track EditModal=false;
    @track load = false;
    @track EditValues;
    get priorities() {
        return [
            { label: 'Low', value: 'Low' },
            { label: 'Medium', value: 'Medium' },
            { label: 'High', value: 'High' },
        ];
    }
    actions = [
        { label: 'Edit', name: 'edit' },
        { label: 'Delete', name: 'delete' },
    ];
    cols=[
        { label: 'Case Number', fieldName: 'CaseNumber', type: 'text' },
        { label: 'Subject', fieldName: 'Subject', type: 'text' },
        { label: 'Status', fieldName: 'Status', type: 'text' },
        { label: 'Origin', fieldName: 'Origin', type: 'text' },
        { label: 'Priority', fieldName: 'Priority', type: 'text' },
        {
            type: 'action',
            typeAttributes: { rowActions: this.actions },
        },
    ];

    connectedCallback(){
        this.GetCases();
    }

    renderedCallback(){
        if(this.EditModal){
            this.template.querySelector('.Id1').value = this.EditValues.id;
            this.template.querySelector('.subject1').value = this.EditValues.subject;;
            this.template.querySelector('.description1').value = this.EditValues.description;;
            this.template.querySelector('.priority1').value = this.EditValues.priority;;
        }
    }

    Toast(title, message, variant){
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }

    async GetCases(){
        try{
            this.load=true;
            const data = await GetCaseById();
            this.Cases = data;
            this.load=false;
        }
        catch(error){
            this.Toast('Error',error,'error');
        }
    }

    ShowNewModal(){
        this.NewModal = true;
    }

    HideNewModal(){
        this.NewModal = false;
    }

   async CreateCase(){
        let sub = this.template.querySelector(".subject").value;
        let des = this.template.querySelector(".description").value;
        let pr = this.template.querySelector(".priority").value;
        if(sub && des && pr){
            this.load=true;
            await NewCase({Subject:sub,Description:des,Priority:pr})
            .then(result => {
                this.load=false;
                this.NewCase=false;
                this.Toast('Success!',`Case created successfully [Id:${result}]`,'success');
            })
            .catch(error => {
                this.Toast('Error',error,'error');
            });
        }
        else{
            this.Toast('Error','Please fill all fields','error');
        }
    }


    async RowActions(event){
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        const { Id, Subject, Description, Priority } = row;
        if(actionName === 'edit'){
            this.ShowEditModal();
            this.EditValues = {id:Id,subject:Subject,description:Description,priority:Priority};
        }
        else if(actionName==='delete'){
            const result = await LightningConfirm.open({
                variant: 'header',
                label: 'Do want to delete?',
                message:`[ID : ${Id}, Subject : ${Subject}, Priority : ${Priority}]`,
                theme:'destructive'
            });
            if(result){
                this.load=true;
                await DeleteCase({CaseId:Id})
                .then(result => {
                    this.load=false;
                    this.Toast('Success!','Case deleted successfuly','success');
                })
                .catch(error => {
                    this.Toast('Error',error,'error');
                });
            }
        }
    }


    ShowEditModal(){
        this.EditModal = true;
    }

    HideEditModal(){
        this.EditModal = false;
    }

    async EditCase(){
        const caseid = this.template.querySelector('.Id1').value;
        const FieldsandValues = {
            Subject:this.template.querySelector('.subject1').value,
            Description:this.template.querySelector('.description1').value,
            Priority:this.template.querySelector('.priority1').value,
        }
        this.load = true;
        await UpdateCase({CaseId:caseid,Fields:JSON.stringify(FieldsandValues)})
        .then(result => {
            this.load = false;
            this.Toast('Success!',`Case updated successfully [ID:${result}]`,'success');
            this.HideEditModal();
        })
        .catch(error => {
            this.Toast('Error',error,'error');
        });
    }

}

//Refer : Info.md