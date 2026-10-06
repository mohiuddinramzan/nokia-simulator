package __PACKAGE__;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.telephony.SmsManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;

@CapacitorPlugin(
    name = "RetroPhone",
    permissions = {
        @Permission(alias = "call", strings = { Manifest.permission.CALL_PHONE }),
        @Permission(alias = "sendSms", strings = { Manifest.permission.SEND_SMS })
    }
)
public class RetroPhonePlugin extends Plugin {

    @PluginMethod
    public void call(PluginCall call) {
        String number = call.getString("number");
        if (number == null || number.trim().isEmpty()) {
            call.reject("number required");
            return;
        }
        if (getPermissionState("call") != PermissionState.GRANTED) {
            requestPermissionForAlias("call", call, "callPermissionResult");
            return;
        }
        startCall(call, number, Intent.ACTION_CALL);
    }

    @PermissionCallback
    private void callPermissionResult(PluginCall call) {
        String number = call.getString("number");
        boolean granted = getPermissionState("call") == PermissionState.GRANTED;
        startCall(call, number, granted ? Intent.ACTION_CALL : Intent.ACTION_DIAL);
    }

    private void startCall(PluginCall call, String number, String action) {
        try {
            Intent intent = new Intent(action, Uri.parse("tel:" + Uri.encode(number.trim())));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject result = new JSObject();
            result.put("dialer", Intent.ACTION_DIAL.equals(action));
            call.resolve(result);
        } catch (Exception e) {
            call.reject("call failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void sendSms(PluginCall call) {
        String number = call.getString("number");
        String body = call.getString("body");
        if (number == null || number.trim().isEmpty() || body == null || body.isEmpty()) {
            call.reject("number and body required");
            return;
        }
        if (getPermissionState("sendSms") != PermissionState.GRANTED) {
            requestPermissionForAlias("sendSms", call, "sendSmsPermissionResult");
            return;
        }
        deliverSms(call, number.trim(), body);
    }

    @PermissionCallback
    private void sendSmsPermissionResult(PluginCall call) {
        if (getPermissionState("sendSms") == PermissionState.GRANTED) {
            deliverSms(call, call.getString("number").trim(), call.getString("body"));
        } else {
            call.reject("SMS permission denied");
        }
    }

    private void deliverSms(PluginCall call, String number, String body) {
        try {
            SmsManager manager = Build.VERSION.SDK_INT >= 31
                ? getContext().getSystemService(SmsManager.class)
                : SmsManager.getDefault();
            ArrayList<String> parts = manager.divideMessage(body);
            manager.sendMultipartTextMessage(number, null, parts, null, null);
            call.resolve();
        } catch (Exception e) {
            call.reject("send failed: " + e.getMessage());
        }
    }
}
