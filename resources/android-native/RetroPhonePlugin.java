package __PACKAGE__;

import android.Manifest;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.telephony.SmsManager;

import com.getcapacitor.JSArray;
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
        @Permission(alias = "sendSms", strings = { Manifest.permission.SEND_SMS }),
        @Permission(alias = "readSms", strings = { Manifest.permission.READ_SMS })
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

    @PluginMethod
    public void listSms(PluginCall call) {
        if (getPermissionState("readSms") != PermissionState.GRANTED) {
            requestPermissionForAlias("readSms", call, "readSmsPermissionResult");
            return;
        }
        readSms(call);
    }

    @PermissionCallback
    private void readSmsPermissionResult(PluginCall call) {
        if (getPermissionState("readSms") == PermissionState.GRANTED) {
            readSms(call);
        } else {
            call.reject("SMS read permission denied");
        }
    }

    private void readSms(PluginCall call) {
        String box = "sent".equals(call.getString("box")) ? "sent" : "inbox";
        int limit = Math.min(200, Math.max(1, call.getInt("limit", 50)));
        JSArray messages = new JSArray();
        Uri uri = Uri.parse("content://sms/" + box);
        String[] columns = { "_id", "address", "body", "date", "read" };
        try (Cursor cursor = getContext().getContentResolver().query(uri, columns, null, null, "date DESC")) {
            while (cursor != null && cursor.moveToNext() && messages.length() < limit) {
                JSObject item = new JSObject();
                item.put("id", cursor.getString(0));
                item.put("address", cursor.getString(1));
                item.put("body", cursor.getString(2));
                item.put("date", cursor.getLong(3));
                item.put("read", cursor.getInt(4));
                messages.put(item);
            }
        } catch (Exception e) {
            call.reject("read failed: " + e.getMessage());
            return;
        }
        JSObject result = new JSObject();
        result.put("messages", messages);
        call.resolve(result);
    }
}
