function Validator(formSelector) {
    let _this = this;

    function getParentElement(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    let formRules = {};
    let validatorRules = {
        'required': function (value) {
            return value ? undefined : 'Please enter the value';
        },
        'email': function (value) {
            const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return regex.test(value) ? undefined : 'Please enter a valid email address';
        },
        'min': function (min) {
            return function (value) {
                return value.length >= min ? undefined : `Please enter at least ${min} characters`;
            }
        }
    };

    const formElement = document.querySelector(formSelector);

    if (formElement) {
        const inputs = formElement.querySelectorAll('[name][rules]');

        for (let input of inputs) {
            let rules = input.getAttribute('rules').split('|');

            for (let rule of rules) {
                let ruleInfo;
                let isRuleHasValue = rule.includes(':');

                if (isRuleHasValue) {
                    ruleInfo = rule.split(':');
                    rule = ruleInfo[0];
                }

                let ruleFunc = validatorRules[rule];

                if (isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }
                
                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc);
                } else {
                    formRules[input.name] = [ruleFunc];
                }
            }

            input.onblur = handleValidate;
            input.oninput = handleClearErrors;
        }

        function handleValidate(event) {
            let rules = formRules[event.target.name];
            let errorMessage;

            rules.some(rule => {
                errorMessage = rule(event.target.value);
                if (errorMessage) return true;
            });

            if (errorMessage) {
                let formGroupElement = getParentElement(event.target, '.form-group');
                if (formGroupElement) {
                    formGroupElement.classList.add('invalid');
                    let errorElement = formGroupElement.querySelector('.form-message');
                    errorElement ? (errorElement.innerText = errorMessage) : undefined;
                }
            }
       
            return errorMessage;
        }

        function handleClearErrors(event) {
            const formGroupElement = getParentElement(event.target, '.form-group');

            if (formGroupElement.classList.contains('invalid')) {
                formGroupElement.classList.remove('invalid');
                const errorElement = formGroupElement.querySelector('.form-message');
                errorElement ? (errorElement.innerText = '') : undefined;
            }
        }
      
        formElement.onsubmit = function (event) {
            event.preventDefault();

            let isValidForm = true;

            for (let input of inputs) {
                // allow pass event
                let hasError = handleValidate({ target: input });

                if (hasError) {
                    isValidForm = false;
                }
            }
        
            if (isValidForm) {
                if (typeof _this.onSubmit === 'function') {
                    let enableInputs = formElement.querySelectorAll('[name]:not([disabled])');
                 
                    const formValues = Array.from(enableInputs).reduce((values, input) => {
                        switch (input.type) {
                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    values[input.name] = '';
                                    return values;
                                }

                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;
                            case 'radio':
                                values[input.name] = formElement.querySelector(`input[name=${input.name}]:checked`).value;
                                break;
                            case 'file':
                                values[input.name] = input.files;
                            default:
                                values[input.name] = input.value;
                        }

                        return values;
                    }, {});

                    _this.onSubmit(formValues);
                } else {
                    formElement.submit();
                }
            }
        }
    }
}