<?php
// ... [Existing Code] ...

class Multi_Currency {
    // ... [Existing Code] ...
    
    // NEW: API Logic
    public static function perform_remote_conversion($product_ids, $license_key, $rounding_rule) {
        $items = [];
        foreach ($product_ids as $pid) {
            $product = wc_get_product($pid);
            if (!$product) continue;
            
            $items[] = [
                'id' => $pid,
                'regular_price' => $product->get_regular_price(),
                'sale_price' => $product->get_sale_price()
            ];
        }

        $response = wp_remote_post('https://api.invent2025.org/api/v1/quota-check', [
            'body' => json_encode([
                'api_key' => $license_key ?: 'FREE', // Send 'FREE' if empty
                'site_url' => get_site_url(),
                'rounding_rule' => $rounding_rule,
                'items' => $items
            ]),
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 15
        ]);

        if (is_wp_error($response)) {
            return ['success' => false, 'message' => $response->get_error_message()];
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        if (!$body['allowed']) {
            return ['success' => false, 'message' => $body['message']]; // e.g. "Quota Exceeded"
        }

        // Apply Results
        foreach ($body['results'] as $res) {
            $pid = $res['id'];
            if ($res['new_regular']) update_post_meta($pid, '_regular_price', $res['new_regular']);
            if ($res['new_sale']) update_post_meta($pid, '_sale_price', $res['new_sale']);
            update_post_meta($pid, '_bgn_eur_converted_date', current_time('mysql'));
            wc_delete_product_transients($pid);
        }

        return ['success' => true, 'count' => count($body['results'])];
    }
}

// ... [AJAX Handler Update] ...
add_action('wp_ajax_prices_bgn_eur_convert_selected', function() {
    // ... [Security Checks] ...
    
    $product_ids = ...; // Get IDs
    $license_key = ...; 
    $rounding_rule = ...;

    // CALL API
    $result = \Prices_BGN_EUR\Front_End\Multi_Currency::perform_remote_conversion($product_ids, $license_key, $rounding_rule);

    if ($result['success']) {
        wp_send_json_success(['message' => 'Processed ' . $result['count'] . ' items.']);
    } else {
        wp_send_json_error(['message' => $result['message']]);
    }
});
