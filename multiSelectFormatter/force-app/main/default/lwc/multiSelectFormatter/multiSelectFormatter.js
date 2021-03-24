/**
 * @who      : Lightful <rhodes@lightful.com>
 * @when     : 2020 Aug 19
 * @what     : Takes EITHER a Multi-select-type String "Cars;Trucks;Fire Engine" **OR** a Record Id, Object Name and Field
 *             Both HTML and Regular Text can be inserted between output values.
 *             --> IF A STRING - Simply splits and inserts a configured piece of HTML or text and inserts between. -- FASTER.
 *             --> IF A RECORD ID, OBJ & FIELD - Uses the getRecord() API to retrieve, and then seperates into a string -- SLOWER.
 */
import { LightningElement, api, wire} from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'

let FIELDS = [];

export default class MultiSelectFormatter extends LightningElement {
    @api fieldName; //OPTIONAL - The API name of a field. E.g. "My_Expertise__c". 
    @api objectName; //OPTIONAL - The API name of an object. E.g. "Contact". 
    @api recordId; //OPTIONAL - Record ID.
    @api beforeItemValue; //What to insert before each element. Accepts HTML or Text. E.g. If this value is '|' Then "Cars;Trucks;Fire Engine" will become "|Cars|Trucks|Fire Engine"
    @api afterItemValue; //Same as above but for the end of the string.
    @api hideAfterItemValueOnLastElement = false; //If true, will not add the after value on the last element. E.g. "Cars, Trucks, Fire Engine, " would become "Cars, Trucks, Fire Engine"
    initialized = false; //Prevents excessive rendering.

    //OPTIONAL - A regular String. E.g. "Cars;Trucks;Fire Engine". If this has a value, it will override the getRecord() API.
    @api get multiSelectString() {
        return this._multiSelectString;
    }
    set multiSelectString(value) {
        this.initialized = false;
        this._multiSelectString = value;
        this.outputMultiSelect(value);
    }

    //Gets the FIELDS and processes the returning string.
    @wire(getRecord, { recordId: '$recordId', fields: FIELDS})
    objectInfo({error, data}) {
        if (data) {
            var dataString = data.fields[this.fieldName].value;
            if (!this.initialized) {
                this.outputMultiSelect(dataString);
                this.initialized = true;
            }
        }
        if (error) {
            if (FIELDS.length > 0) {
                console.log(JSON.parse(JSON.stringify(error)));
                const event = new ShowToastEvent({
                    variant: 'error',
                    title: 'Error while rendering ' + this.fieldName + ' in multiSelectFormatter component.',
                    message: error.detail.message,
                });
                this.dispatchEvent(event);
            }
        }
    };

     /**
     * @description : Pushes into FIELDS the objectName combined with the fieldName. E.g. 'Contact' + '.' + 'My_expertise__c' --> 'Contact.My_expertise__c'.
     * @params	    : N/A
     */
    connectedCallback() {
        if (!this.multiSelectString) {
            FIELDS.push(this.objectName + '.' + this.fieldName);
        }
    }

    /**
     * @description : If a regular Multi-select String, processes it..
     * @params	    : N/A
     */
    renderedCallback() {
        if (!this.initialized && this.multiSelectString) {
            this.outputMultiSelect(this.multiSelectString);
            this.initialized = true;
        }
    }
    
    /**
     * @description : Gets the multi-select-output div, splits up the string and loops through, appending values on both ends of the value.
     * @params	    : stringForProcessing -- Takes a Multi-Select string e.g. "Cars;Trucks;Fire Engine" and processes.
     */
    outputMultiSelect = (stringForProcessing) => {
        var htmlElementToAppendTo = this.template.querySelector('.multi-select-output');
        var splitMultiSelect = stringForProcessing?.split(';');

        if (!htmlElementToAppendTo) return;

        // clear the innerHTML firstly
        htmlElementToAppendTo.innerHTML = '';

        splitMultiSelect?.forEach((multiSelectSingleValue, i) => {
            htmlElementToAppendTo.innerHTML 
                +=  (this.beforeItemValue ? this.beforeItemValue : '') +
                    multiSelectSingleValue +
                    (this.hideAfterItemValueOnLastElement && i == splitMultiSelect.length - 1 ? '' : this.afterItemValue); //If want to hide last item, and it IS the last item, hide the after value.
        })
    }
}