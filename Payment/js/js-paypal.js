document.observe('dom:loaded', 
    function () {
        submitText = $$('.form-submit-button')[0] ? $$('.form-submit-button')[0].innerHTML : "";
        var thisForm = $$('form.jotform-form')[0];
        var paymentFieldId = $$('input[name="simple_fpc"]')[0].value;
        var donationInput = $('input_' + paymentFieldId + '_donation');
        
        // set post message listeners
        if (window.addEventListener) {
            window.addEventListener("message", handlePaypalPostMessage, false);
        } else if (window.attachEvent) {
            window.attachEvent("onmessage", handlePaypalPostMessage);
        }
        
        Event.observe(thisForm, 'submit', function (e) {

            if(JotForm.isEditMode()) {
                return true;
            }

            if (JotForm.isPaymentSelected() && (!$('id_' + paymentFieldId) || JotForm.paymentTotal > 0)) {
                // add hidden iframe for paypal
                if(!$('hidden_paypal_form')){
                    var iframe = new Element('iframe', {name:'hidden_paypal', id:'hidden_paypal_form', sandbox: 'allow-top-navigation allow-scripts'}).hide();
                    $(document.body).insert(iframe);
                    // fallback solution for when the first submit fails
                    setTimeout(function () { // timeout to load event trigger (firefox) on iframe insertion (b#430248)
                        iframe.observe('load', function() {
                            setTimeout(function () {
                                if (!$('paypal_form') && !JotForm.captchaFail) {
                                    // re-submit
                                    thisForm.removeAttribute('target');
                                    $('paypal_submission').remove();
                                    thisForm.submit();
                                }
                            }, 500);
                        });
                    }, 500);
                }
                // change form's target to hidden iframe
                thisForm.writeAttribute('target', 'hidden_paypal');
                if (!$('paypal_submission')) {
                    thisForm.insert({
                        top: new Element('input', {
                            type: 'hidden',
                            name: 'paypal_submission',
                            id:   'paypal_submission'
                        }).putValue("1")
                    });
                }
            } else {
                // remove paypal related elements
                ['hidden_paypal_form' ,'paypal_submission'].each(function(el) {
                    if ($(el)) {
                        $(el).remove();
                    }
                });
                // remove target
                if (thisForm.target === "hidden_paypal") {
                    thisForm.removeAttribute('target');
                }
            }
        });
    }
);
var submitText = "";
    
// post message handler
function handlePaypalPostMessage(e) {
    if (typeof e.data !== 'string' || e.data.indexOf('{') !== 0) { return; }
    try {
        var res = JSON.parse(e.data.strip());
        // if this is not a paypal-related post message
        if (!res.paypal && !res.captchaFail) {
            return;
        }
        // if captcha failed
        if (res.captchaFail) {
            alert("Incorrect captcha answer. Please try again.");
            // get captcha field
            var captchaField = $$('input[name="captcha"], input[name="recaptcha_response_field"]').length > 0 
                ? $$('input[name="captcha"], input[name="recaptcha_response_field"]')[0] 
                : false;
            if (captchaField) {
                captchaField.clear();
                captchaField.focus();
                if (captchaField.getAttribute('name') == "recaptcha_response_field") {
                    Recaptcha.reload(); // reload recaptcha image
                }
            }
            $$('.form-submit-button').each(function(b){
                b.enable();
                b.innerHTML = submitText;
            });
            JotForm.captchaFail = true;
            return;
        }
        JotForm.captchaFail = false;
        // create paypal form
        $$('body')[0].insert(new Element('form', {
            id: 'paypal_form',
            action: res.url,
            method: 'post',
            target: '_top'
        }));
        var errorMsg = "";
        // add fields to the paypal form
        $H(res.fields).each(function (r) {
            var val = decodeURIComponent(r.value);
            // if Paypal account is empty
            if (r.key === "business" && val === "") {
                errorMsg = 'Invalid PayPal account used. Please contact form owner.';
            }

            if ($$('[name="' + r.key + '"]')[0]) {
                $$('[name="' + r.key + '"]')[0].putValue(val);
                return;
            }

            $('paypal_form').insert(new Element('input',{
                type: 'hidden',
                name: r.key
            }).putValue(val));
        });
        if (!errorMsg) {
            $('paypal_form').submit();
        } else {
            alert(errorMsg);
            $$('.form-submit-button').each(function(b){
                b.enable();
                b.innerHTML = submitText;
            });
        }
    } catch (err) {
        alert('An error has occurred. Please try again or contact the form owner.');
    }
};
