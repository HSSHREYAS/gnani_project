/**
 * Translations Dictionary — Coastal Kannada (ಕರಾವಳಿ ಕನ್ನಡ) & English
 * Authentic local marine dialect terms spoken across Karwar, Udupi, and Mangalore.
 */

export type Language = 'en' | 'kn';

export interface Translations {
  // Navigation tabs
  tab_home: string;
  tab_map: string;
  tab_alerts: string;
  tab_profile: string;
  tab_voice: string;
  greet_morning: string;
  greet_afternoon: string;
  greet_evening: string;
  profile_fisher_name_label: string;
  profile_name_kn_label: string;
  profile_name_kn_hint: string;
  qa_heading: string;
  qa_catch_sub: string;
  qa_distress_sub: string;
  qa_fleet_sub: string;
  qa_equipment_sub: string;
  map_best: string;
  map_best_for: string;
  map_official: string;
  map_satellite: string;
  adv_from_port: string;
  adv_zone_near: string;
  adv_incois_date: string;
  adv_none: string;
  risk_label: string;
  updated_ago: string;
  old_data_warning: string;
  satellite_on: string;
  sea_state_unknown: string;
  no_reading_badge: string;
  greeting_friend: string;
  unit_min: string;
  unit_hr: string;
  unit_days: string;
  ps_calm: string;
  ps_caution: string;
  ps_rough: string;
  ps_ports_heading: string;
  ps_no_data: string;
  ps_source_note: string;
  ps_your_port: string;
  profile_stat_catch: string;
  profile_setup_name: string;
  profile_setup_hint: string;
  not_set: string;
  sos_gps_live: string;
  sos_gps_old: string;
  sos_no_gps: string;
  sos_gps_searching: string;
  sos_gps_denied: string;
  sos_allow_gps: string;
  sos_accuracy: string;
  map_title: string;
  map_from: string;
  map_fishing: string;
  map_risk: string;
  map_no_zones: string;
  map_pick: string;
  map_distance: string;
  map_diesel: string;
  map_run_time: string;
  map_view_route: string;
  map_start_nav: string;
  map_stop_nav: string;
  map_exit: string;
  map_steps: string;
  map_to_go: string;
  map_steer: string;
  map_speed: string;
  map_eta: string;
  map_waiting_gps: string;
  map_gps_denied: string;
  map_arrived: string;
  map_bulletin: string;
  map_model_zone: string;
  map_depth: string;
  map_sat_score: string;
  map_est_note: string;
  risk_sheet_title: string;
  risk_tap_hint: string;
  risk_no_data: string;
  voice_speaking: string;
  voice_try: string;

  // Top Bar & Connectivity
  app_name: string;
  app_subtitle: string;
  greeting_morning: string;
  greeting_afternoon: string;
  greeting_evening: string;
  user_full_name: string;
  banner_slogan_kn: string;
  banner_slogan_en: string;
  current_conditions: string;
  safe_to_fish: string;
  caution_to_fish: string;
  unsafe_to_fish: string;
  view_all: string;
  badge_pro: string;
  live_connected: string;
  offline_cached: string;
  connecting: string;

  // Weather Card & Metrics
  wind_speed: string;
  wave_height: string;
  humidity: string;
  sea_temp: string;
  chlorophyll: string;
  km_per_hour: string;
  meters: string;

  // Weather Condition Badges
  cond_clear_calm: string;
  cond_moderate: string;
  cond_rough_sea: string;
  cond_high_wind: string;
  cond_favorable: string;
  cond_caution: string;
  cond_dangerous: string;

  // Fishing Advisory
  advisory_title: string;
  advisory_official: string;
  advisory_view_map: string;
  advisory_none_active: string;
  advisory_safe_notice: string;
  advisory_loading: string;
  advisory_view_more: string;
  advisory_show_less: string;
  today_advisory: string;
  view_on_map: string;
  greeting_namaskara: string;
  user_rameshanna: string;
  check_sea_conditions: string;
  wind_label: string;
  waves_label: string;
  humidity_label: string;
  sea_temp_label: string;
  chlorophyll_label: string;
  favorable_for_fishing: string;
  pfz_near_honnavar: string;

  // Quick Action Cards
  qa_fleet: string;
  qa_catch: string;
  qa_distress: string;
  qa_equipment: string;

  // Catch Logs Modal
  cl_title: string;
  cl_subtitle: string;
  cl_new_entry: string;
  cl_history: string;
  cl_select_species: string;
  cl_custom_species: string;
  cl_weight_kg: string;
  cl_rate_per_kg: string;
  cl_notes: string;
  cl_btn_save: string;
  cl_total_weight: string;
  cl_total_revenue: string;
  cl_no_records: string;
  cl_delete_confirm: string;

  // Marine Species (Coastal Dialect)
  species_mackerel: string;
  species_sardine: string;
  species_kingfish: string;
  species_pomfret: string;
  species_tuna: string;
  species_prawn: string;
  species_squid: string;

  // Distress / SOS Modal
  sos_title: string;
  sos_subtitle: string;
  sos_position_beacon: string;
  sos_latitude: string;
  sos_longitude: string;
  sos_broadcast_btn: string;
  sos_broadcast_sub: string;
  sos_helpline_heading: string;
  sos_coast_guard: string;
  sos_coast_guard_sub: string;
  sos_coastal_police: string;
  sos_coastal_police_sub: string;
  sos_emergency_112: string;
  sos_emergency_112_sub: string;
  sos_call_btn: string;
  sos_2g_notice: string;

  // Equipment Checklist Modal
  eq_title: string;
  eq_subtitle: string;
  eq_readiness_title: string;
  eq_ready_to_sail: string;
  eq_attention_required: string;
  eq_safety_count: string;
  eq_reset_btn: string;
  eq_item_life_jackets: string;
  eq_item_life_jackets_desc: string;
  eq_item_vhf: string;
  eq_item_vhf_desc: string;
  eq_item_gps: string;
  eq_item_gps_desc: string;
  eq_item_flares: string;
  eq_item_flares_desc: string;
  eq_item_fuel_water: string;
  eq_item_fuel_water_desc: string;
  eq_item_first_aid: string;
  eq_item_first_aid_desc: string;
  eq_item_anchor: string;
  eq_item_anchor_desc: string;

  // Fleet Tracking Modal
  ft_title: string;
  ft_subtitle: string;
  ft_boats_reporting: string;
  ft_in_fishing_zones: string;
  ft_ports_covered: string;
  ft_zone_distance: string;
  ft_crowd_notice: string;
  ft_harbor_status_title: string;
  ft_vessels_registered: string;
  ft_vessels_offshore: string;
  density_low: string;
  density_moderate: string;
  density_high: string;

  // Location Selector
  loc_select_title: string;
  loc_search_placeholder: string;
  loc_active_badge: string;

  // Alerts & Notices Screen
  alerts_screen_title: string;
  alerts_live_connected: string;
  alerts_offline_cached: string;
  alerts_filter_all: string;
  alerts_filter_official: string;
  alerts_filter_weather: string;
  alerts_filter_advisory: string;
  alerts_filter_news: string;
  alerts_empty_title: string;
  alerts_empty_subtitle: string;
  alerts_empty_refresh_btn: string;

  // Profile & Vessel Settings
  profile_title: string;
  profile_fisher_verified: string;
  profile_stat_trips: string;
  profile_stat_exp: string;
  profile_stat_rating: string;
  profile_vessel_info: string;
  profile_vessel_name: string;
  profile_reg_number: string;
  profile_vessel_type: string;
  profile_location_settings: string;
  profile_default_port: string;
  profile_coverage_area: string;
  profile_karnataka_coast: string;
  profile_language_title: string;
  profile_notifications_title: string;
  profile_push_notifications: string;
  profile_weather_alerts: string;
  profile_edit_vessel: string;
  profile_btn_save: string;
  profile_save_success: string;
  profile_select_port: string;
  vessel_traditional_canoe: string;
  vessel_motorized_craft: string;
  vessel_mechanized_trawler: string;
  vessel_purse_seiner: string;
  vessel_gillnetter: string;

  // General Actions
  btn_close: string;
  btn_cancel: string;
  btn_confirm: string;
  btn_refresh: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    tab_home: 'Home',
    tab_map: 'Map',
    tab_alerts: 'Alerts',
    tab_profile: 'Profile',
    tab_voice: 'Voice',
    greet_morning: 'Good morning',
    greet_afternoon: 'Good afternoon',
    greet_evening: 'Good evening',
    profile_fisher_name_label: 'Your name',
    profile_name_kn_label: 'Name in Kannada (ಕನ್ನಡದಲ್ಲಿ)',
    profile_name_kn_hint: 'Filled in automatically. Correct it if the spelling is wrong.',
    qa_heading: 'Tools',
    qa_catch_sub: 'Record today’s catch',
    qa_distress_sub: 'Call for help',
    qa_fleet_sub: 'Wind & waves at all ports',
    qa_equipment_sub: 'Check before leaving',
    map_best: 'BEST',
    map_best_for: 'Best zones from {port}',
    map_official: 'INCOIS',
    map_satellite: 'Satellite',
    adv_from_port: '{km} km from {port}',
    adv_zone_near: 'Fishing zone near {place}',
    adv_incois_date: 'INCOIS {date}',
    adv_none: 'No INCOIS fishing-zone bulletin is available right now.',
    risk_label: 'Sea Risk',
    updated_ago: 'Updated {age} ago',
    old_data_warning: 'Old reading ({age}) — check before sailing',
    satellite_on: 'Satellite pass {date}',
    sea_state_unknown: 'NO SEA READING',
    no_reading_badge: 'No reading',
    greeting_friend: 'Fisher friend!',
    unit_min: 'min',
    unit_hr: 'hr',
    unit_days: 'days',
    ps_calm: 'CALM',
    ps_caution: 'CAUTION',
    ps_rough: 'ROUGH',
    ps_ports_heading: 'ALL PORTS — ROUGHEST FIRST',
    ps_no_data: 'No live sea readings yet. Check your connection and refresh.',
    ps_source_note: 'Wind and wave readings from Open-Meteo for each port. Use together with official IMD / INCOIS warnings.',
    ps_your_port: 'YOUR PORT',
    profile_stat_catch: 'Catch logged (kg)',
    profile_setup_name: 'Add your name',
    profile_setup_hint: 'Tap the pencil to add your boat details',
    not_set: 'Not set',
    sos_gps_live: 'LIVE GPS POSITION',
    sos_gps_old: 'LAST GPS POSITION — {age} ago',
    sos_no_gps: 'NO GPS YET — showing home port, not your boat',
    sos_gps_searching: 'Searching for GPS…',
    sos_gps_denied: 'Location permission is off. Allow it so rescuers get your real position.',
    sos_allow_gps: 'Allow GPS',
    sos_accuracy: 'Accuracy ±{m} m',
    map_title: 'Fishing Map',
    map_from: 'From',
    map_fishing: 'Fishing Zones',
    map_risk: 'Sea Risk',
    map_no_zones: 'No fishing-zone bulletin is available right now.',
    map_pick: 'Zone',
    map_distance: 'Distance',
    map_diesel: 'Diesel (est.)',
    map_run_time: 'Run time (est.)',
    map_view_route: 'SHOW SEA ROUTE',
    map_start_nav: 'START — FOLLOW MY BOAT',
    map_stop_nav: 'STOP FOLLOWING',
    map_exit: 'Close',
    map_steps: 'Steps',
    map_to_go: 'TO GO',
    map_steer: 'STEER',
    map_speed: 'SPEED',
    map_eta: 'ARRIVE IN',
    map_waiting_gps: 'Waiting for GPS… keep the phone under open sky.',
    map_gps_denied: 'Allow location to follow your boat on the map.',
    map_arrived: 'You are inside the fishing zone',
    map_bulletin: 'INCOIS bulletin {date}',
    map_model_zone: 'Satellite estimate {date}',
    map_depth: '{m} m deep',
    map_sat_score: 'Satellite score {p}%',
    map_est_note: 'Estimates assume 10.5 knots and about 0.7 L diesel per nautical mile.',
    risk_sheet_title: 'Sea risk along the coast',
    risk_tap_hint: 'Tap a circle on the map to see wind and waves there.',
    risk_no_data: 'No sea-risk readings available right now.',
    voice_speaking: 'Speaking the answer…',
    voice_try: 'TRY ASKING',

    app_name: 'MatsyaMitra',
    app_subtitle: 'Your Fishing Companion',
    greeting_morning: 'Good Morning',
    greeting_afternoon: 'Good Afternoon',
    greeting_evening: 'Good Evening',
    user_full_name: 'Ramesh Kumar!',
    banner_slogan_kn: 'ಸುರಕ್ಷಿತ ಸಮುದ್ರ,\nಹೆಚ್ಚು ಮೀನು, ಉತ್ತಮ ಜೀವನ',
    banner_slogan_en: 'Safer Seas • Better Catch • Stronger Tomorrow',
    current_conditions: 'Current Conditions',
    safe_to_fish: 'Safe to Fish',
    caution_to_fish: 'Caution Needed',
    unsafe_to_fish: 'Do Not Venture',
    view_all: 'View All',
    badge_pro: 'Pro',
    live_connected: 'LIVE TELEMETRY CONNECTED',
    offline_cached: 'LIVE DATA UNAVAILABLE',
    connecting: 'Connecting to MatsyaMitra API server...',

    wind_speed: 'WIND SPEED',
    wave_height: 'WAVE HEIGHT',
    humidity: 'HUMIDITY',
    sea_temp: 'SEA TEMP',
    chlorophyll: 'CHLOROPHYLL',
    km_per_hour: 'km/h',
    meters: 'm',

    cond_clear_calm: 'CLEAR & CALM',
    cond_moderate: 'MODERATE',
    cond_rough_sea: 'ROUGH SEA',
    cond_high_wind: 'HIGH WIND',
    cond_favorable: 'FAVORABLE FOR FISHING',
    cond_caution: 'PROCEED WITH CAUTION',
    cond_dangerous: 'DANGER - DO NOT SAIL',

    advisory_title: "Today's Fishing Advisory",
    advisory_official: 'INCOIS Coastal Bulletin',
    advisory_view_map: 'View on Map',
    advisory_none_active: 'No active INCOIS advisories currently available. Live bulletins will appear when published.',
    advisory_safe_notice: 'Conditions are favorable for normal coastal fishing operations.',
    advisory_loading: 'Loading INCOIS advisories...',
    advisory_view_more: 'View More',
    advisory_show_less: 'Show Less',
    today_advisory: "Today's Advisory",
    view_on_map: 'View on Map',
    greeting_namaskara: 'Namaskara',
    user_rameshanna: 'Rameshanna!',
    check_sea_conditions: 'Check sea conditions before you set sail today.',
    wind_label: 'Wind',
    waves_label: 'Waves',
    humidity_label: 'Humidity',
    sea_temp_label: 'Sea Temp',
    chlorophyll_label: 'Chlorophyll',
    favorable_for_fishing: 'Favorable for Fishing',
    pfz_near_honnavar: 'Potential Fishing Zone near Honnavar',

    qa_fleet: 'Port Status',
    qa_catch: 'Catch Logs',
    qa_distress: 'Distress Alerts',
    qa_equipment: 'Equipment',

    cl_title: 'Catch Logs',
    cl_subtitle: '100% Offline Storage',
    cl_new_entry: 'New Entry',
    cl_history: 'History',
    cl_select_species: 'SELECT FISH SPECIES',
    cl_custom_species: 'Or type other species...',
    cl_weight_kg: 'WEIGHT (KG) *',
    cl_rate_per_kg: 'RATE (₹ / KG)',
    cl_notes: 'VOYAGE / NET NOTES',
    cl_btn_save: 'Save Catch Record',
    cl_total_weight: 'Total Catch',
    cl_total_revenue: 'Est. Earnings',
    cl_no_records: 'No catch records saved yet. Add your first catch log offline above.',
    cl_delete_confirm: 'Are you sure you want to remove this entry?',

    species_mackerel: 'Indian Mackerel (ಬಂಗುಡೆ)',
    species_sardine: 'Oil Sardine (ತಾರಲೆ)',
    species_kingfish: 'Kingfish / Seer (ಅಂಜಲ್)',
    species_pomfret: 'Silver Pomfret (ಮಾಂಜಿ)',
    species_tuna: 'Yellowfin Tuna (ಗೆದ್ದರ್)',
    species_prawn: 'White Prawn (ಸೀಗಡಿ)',
    species_squid: 'Squid / Cuttlefish (ಬೊಂಡಾಸ್)',

    sos_title: 'Emergency Distress',
    sos_subtitle: 'Maritime Safety & SOS Broadcast',
    sos_position_beacon: 'CURRENT POSITION BEACON',
    sos_latitude: 'LATITUDE',
    sos_longitude: 'LONGITUDE',
    sos_broadcast_btn: 'BROADCAST MAYDAY (SMS)',
    sos_broadcast_sub: 'Generates emergency SMS beacon with GPS coordinates to Coastal Police (1093)',
    sos_helpline_heading: 'DIRECT MARITIME HELPLINES',
    sos_coast_guard: 'Indian Coast Guard SAR',
    sos_coast_guard_sub: 'National Maritime Search & Rescue (Toll Free)',
    sos_coastal_police: 'Karnataka Coastal Police',
    sos_coastal_police_sub: 'Coastal Security Police Helpline (CSP)',
    sos_emergency_112: 'National Emergency Service',
    sos_emergency_112_sub: 'Police, Ambulance & Fire Integrated',
    sos_call_btn: 'Call',
    sos_2g_notice: 'SMS distress messages can transmit over basic 2G cellular towers even when mobile internet data fails at sea. Keep your phone elevated in open air for strongest signal.',

    eq_title: 'Equipment Checklist',
    eq_subtitle: 'Pre-departure Inspection',
    eq_readiness_title: 'VOYAGE READINESS',
    eq_ready_to_sail: 'READY TO SAIL',
    eq_attention_required: 'ATTENTION REQUIRED',
    eq_safety_count: 'safety checks completed',
    eq_reset_btn: 'Reset',
    eq_item_life_jackets: 'Life Jackets (ISI/SOLAS)',
    eq_item_life_jackets_desc: '1 certified jacket per crew member on board',
    eq_item_vhf: 'VHF Marine Radio',
    eq_item_vhf_desc: 'Tuned and tested on Channel 16 (156.8 MHz)',
    eq_item_gps: 'GPS / Navigation Device',
    eq_item_gps_desc: 'Loaded with coastal waypoints and battery charged',
    eq_item_flares: 'Visual Distress Flares / Smoke',
    eq_item_flares_desc: 'Red handheld flares & orange smoke signals valid',
    eq_item_fuel_water: 'Reserve Fuel & Fresh Water',
    eq_item_fuel_water_desc: 'At least 25% reserve fuel + 5L drinking water/person',
    eq_item_first_aid: 'First Aid Medical Kit',
    eq_item_first_aid_desc: 'Bandages, antiseptic, burn cream, motion sickness tabs',
    eq_item_anchor: 'Secondary Anchor & Manual Bilge Pump',
    eq_item_anchor_desc: 'Emergency anchoring and bailing readiness',

    ft_title: 'Port Sea Status',
    ft_subtitle: 'Live wind & waves',
    ft_boats_reporting: 'BOATS REPORTING',
    ft_in_fishing_zones: 'IN FISHING ZONES',
    ft_ports_covered: 'Across 6 major ports',
    ft_zone_distance: 'Within 12–25 NM',
    ft_crowd_notice: 'MatsyaMitra dynamically redistributes zone recommendations away from high-density harbors to prevent overfishing and gear tangles.',
    ft_harbor_status_title: 'REGIONAL HARBOR VESSEL STATUS',
    ft_vessels_registered: 'registered vessels',
    ft_vessels_offshore: 'offshore',
    density_low: 'Low Density',
    density_moderate: 'Moderate Density',
    density_high: 'High Density',

    loc_select_title: 'Select Coastal Location',
    loc_search_placeholder: 'Search port or harbor...',
    loc_active_badge: 'ACTIVE',

    alerts_screen_title: 'Alerts & Notices',
    alerts_live_connected: 'LIVE FEED CONNECTED',
    alerts_offline_cached: 'OFFLINE / CACHED NOTICES',
    alerts_filter_all: 'All',
    alerts_filter_official: 'Official',
    alerts_filter_weather: 'Weather',
    alerts_filter_advisory: 'Advisory',
    alerts_filter_news: 'News',
    alerts_empty_title: 'No new alerts today',
    alerts_empty_subtitle: "The sea is calm. We'll notify you if any official advisories are issued.",
    alerts_empty_refresh_btn: 'CHECK FOR UPDATES',

    profile_title: 'Profile & Vessel Settings',
    profile_fisher_verified: 'Verified Fisher ID',
    profile_stat_trips: 'Trips logged',
    profile_stat_exp: 'Years Exp.',
    profile_stat_rating: 'Rating',
    profile_vessel_info: 'Vessel Information',
    profile_vessel_name: 'Vessel Name',
    profile_reg_number: 'Registration',
    profile_vessel_type: 'Vessel Type',
    profile_location_settings: 'Location Settings',
    profile_default_port: 'Default Home Port',
    profile_coverage_area: 'Coverage Area',
    profile_karnataka_coast: 'Karnataka Coast',
    profile_language_title: 'Language',
    profile_notifications_title: 'Notifications',
    profile_push_notifications: 'Push Notifications',
    profile_weather_alerts: 'Marine Weather Alerts',
    profile_edit_vessel: 'Edit Vessel Details',
    profile_btn_save: 'Save Profile',
    profile_save_success: 'Profile & vessel settings saved successfully!',
    profile_select_port: 'Select Default Home Port',
    vessel_traditional_canoe: 'Traditional Canoe',
    vessel_motorized_craft: 'Motorized Craft (OBM)',
    vessel_mechanized_trawler: 'Mechanized Trawler',
    vessel_purse_seiner: 'Purse Seiner',
    vessel_gillnetter: 'Gillnetter',

    btn_close: 'Close',
    btn_cancel: 'Cancel',
    btn_confirm: 'Confirm',
    btn_refresh: 'Refresh',
  },

  kn: {
    tab_home: 'ಮುಖಪುಟ',
    tab_map: 'ನಕ್ಷೆ',
    tab_alerts: 'ಎಚ್ಚರಿಕೆಗಳು',
    tab_profile: 'ಪ್ರೊಫೈಲ್',
    tab_voice: 'ಧ್ವನಿ',
    greet_morning: 'ಶುಭೋದಯ',
    greet_afternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ',
    greet_evening: 'ಶುಭ ಸಂಜೆ',
    profile_fisher_name_label: 'ನಿಮ್ಮ ಹೆಸರು',
    profile_name_kn_label: 'ಕನ್ನಡದಲ್ಲಿ ಹೆಸರು',
    profile_name_kn_hint: 'ಇದು ತಾನಾಗಿ ಬರೆಯಲ್ಪಡುತ್ತದೆ. ತಪ್ಪಿದ್ದರೆ ಸರಿಪಡಿಸಿ.',
    qa_heading: 'ಸೌಲಭ್ಯಗಳು',
    qa_catch_sub: 'ಇಂದಿನ ಮೀನು ಬರೆಯಿರಿ',
    qa_distress_sub: 'ಸಹಾಯಕ್ಕೆ ಕರೆ ಮಾಡಿ',
    qa_fleet_sub: 'ಎಲ್ಲಾ ಬಂದರುಗಳ ಗಾಳಿ, ಅಲೆ',
    qa_equipment_sub: 'ಹೊರಡುವ ಮುನ್ನ ಪರಿಶೀಲಿಸಿ',
    map_best: 'ಉತ್ತಮ',
    map_best_for: '{port}ದಿಂದ ಉತ್ತಮ ವಲಯಗಳು',
    map_official: 'INCOIS',
    map_satellite: 'ಉಪಗ್ರಹ',
    adv_from_port: '{port}ದಿಂದ {km} ಕಿ.ಮೀ',
    adv_zone_near: '{place} ಸಮೀಪ ಮೀನು ವಲಯ',
    adv_incois_date: 'INCOIS {date}',
    adv_none: 'ಸದ್ಯ INCOIS ಮೀನು ವಲಯದ ಪ್ರಕಟಣೆ ಲಭ್ಯವಿಲ್ಲ.',
    risk_label: 'ಸಮುದ್ರ ಅಪಾಯ',
    updated_ago: '{age} ಹಿಂದೆ ನವೀಕರಿಸಲಾಗಿದೆ',
    old_data_warning: 'ಹಳೆಯ ಮಾಹಿತಿ ({age}) — ಹೊರಡುವ ಮುನ್ನ ಪರಿಶೀಲಿಸಿ',
    satellite_on: 'ಉಪಗ್ರಹ ಮಾಹಿತಿ {date}',
    sea_state_unknown: 'ಸಮುದ್ರದ ಮಾಹಿತಿ ಇಲ್ಲ',
    no_reading_badge: 'ಮಾಹಿತಿ ಇಲ್ಲ',
    greeting_friend: 'ಮೀನುಗಾರ ಮಿತ್ರ!',
    unit_min: 'ನಿಮಿಷ',
    unit_hr: 'ಗಂಟೆ',
    unit_days: 'ದಿನ',
    ps_calm: 'ಶಾಂತ',
    ps_caution: 'ಎಚ್ಚರಿಕೆ',
    ps_rough: 'ಅಪಾಯ',
    ps_ports_heading: 'ಎಲ್ಲಾ ಬಂದರುಗಳು — ಅಪಾಯ ಹೆಚ್ಚಿರುವುದು ಮೊದಲು',
    ps_no_data: 'ಇನ್ನೂ ಸಮುದ್ರದ ಮಾಹಿತಿ ಬಂದಿಲ್ಲ. ನೆಟ್‌ವರ್ಕ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    ps_source_note: 'ಪ್ರತಿ ಬಂದರಿನ ಗಾಳಿ ಮತ್ತು ಅಲೆ ಮಾಹಿತಿ Open-Meteo ಮೂಲದಿಂದ. ಅಧಿಕೃತ IMD / INCOIS ಎಚ್ಚರಿಕೆಗಳ ಜೊತೆ ಬಳಸಿ.',
    ps_your_port: 'ನಿಮ್ಮ ಬಂದರು',
    profile_stat_catch: 'ದಾಖಲಾದ ಮೀನು (ಕೆಜಿ)',
    profile_setup_name: 'ನಿಮ್ಮ ಹೆಸರು ಸೇರಿಸಿ',
    profile_setup_hint: 'ದೋಣಿ ವಿವರ ಸೇರಿಸಲು ಪೆನ್ಸಿಲ್ ಒತ್ತಿ',
    not_set: 'ಸೇರಿಸಿಲ್ಲ',
    sos_gps_live: 'ನೇರ GPS ಸ್ಥಾನ',
    sos_gps_old: 'ಕೊನೆಯ GPS ಸ್ಥಾನ — {age} ಹಿಂದೆ',
    sos_no_gps: 'GPS ಇನ್ನೂ ಸಿಕ್ಕಿಲ್ಲ — ಇದು ಮನೆ ಬಂದರಿನ ಸ್ಥಾನ, ದೋಣಿಯದ್ದಲ್ಲ',
    sos_gps_searching: 'GPS ಹುಡುಕಲಾಗುತ್ತಿದೆ…',
    sos_gps_denied: 'ಸ್ಥಳ ಅನುಮತಿ ಆಫ್ ಆಗಿದೆ. ನಿಮ್ಮ ನಿಜವಾದ ಸ್ಥಾನ ಕಳುಹಿಸಲು ಅನುಮತಿ ನೀಡಿ.',
    sos_allow_gps: 'GPS ಅನುಮತಿ ನೀಡಿ',
    sos_accuracy: 'ನಿಖರತೆ ±{m} ಮೀ',
    map_title: 'ಮೀನುಗಾರಿಕೆ ನಕ್ಷೆ',
    map_from: 'ಇಂದ',
    map_fishing: 'ಮೀನು ವಲಯ',
    map_risk: 'ಸಮುದ್ರ ಅಪಾಯ',
    map_no_zones: 'ಸದ್ಯ ಮೀನುಗಾರಿಕೆ ವಲಯದ ಬುಲೆಟಿನ್ ಲಭ್ಯವಿಲ್ಲ.',
    map_pick: 'ವಲಯ',
    map_distance: 'ದೂರ',
    map_diesel: 'ಡೀಸೆಲ್ (ಅಂದಾಜು)',
    map_run_time: 'ಸಮಯ (ಅಂದಾಜು)',
    map_view_route: 'ಸಮುದ್ರ ಮಾರ್ಗ ತೋರಿಸಿ',
    map_start_nav: 'ಆರಂಭಿಸಿ — ನನ್ನ ದೋಣಿ ಹಿಂಬಾಲಿಸಿ',
    map_stop_nav: 'ನಿಲ್ಲಿಸಿ',
    map_exit: 'ಮುಚ್ಚಿ',
    map_steps: 'ಹಂತಗಳು',
    map_to_go: 'ಬಾಕಿ ದೂರ',
    map_steer: 'ದಿಕ್ಕು',
    map_speed: 'ವೇಗ',
    map_eta: 'ತಲುಪಲು',
    map_waiting_gps: 'GPS ಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ… ಫೋನ್ ಅನ್ನು ತೆರೆದ ಆಕಾಶದ ಕೆಳಗೆ ಇಡಿ.',
    map_gps_denied: 'ನಕ್ಷೆಯಲ್ಲಿ ದೋಣಿ ತೋರಿಸಲು ಸ್ಥಳ ಅನುಮತಿ ನೀಡಿ.',
    map_arrived: 'ನೀವು ಮೀನುಗಾರಿಕೆ ವಲಯದ ಒಳಗಿದ್ದೀರಿ',
    map_bulletin: 'INCOIS ಬುಲೆಟಿನ್ {date}',
    map_model_zone: 'ಉಪಗ್ರಹ ಅಂದಾಜು {date}',
    map_depth: '{m} ಮೀ ಆಳ',
    map_sat_score: 'ಉಪಗ್ರಹ ಅಂಕ {p}%',
    map_est_note: 'ಅಂದಾಜು: 10.5 ನಾಟ್ ವೇಗ ಮತ್ತು ಪ್ರತಿ ನಾಟಿಕಲ್ ಮೈಲಿಗೆ ಸುಮಾರು 0.7 ಲೀ ಡೀಸೆಲ್.',
    risk_sheet_title: 'ಕರಾವಳಿಯ ಸಮುದ್ರ ಅಪಾಯ',
    risk_tap_hint: 'ಗಾಳಿ ಮತ್ತು ಅಲೆ ನೋಡಲು ನಕ್ಷೆಯ ವೃತ್ತವನ್ನು ಒತ್ತಿ.',
    risk_no_data: 'ಸದ್ಯ ಸಮುದ್ರ ಅಪಾಯದ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.',
    voice_speaking: 'ಉತ್ತರ ಹೇಳಲಾಗುತ್ತಿದೆ…',
    voice_try: 'ಹೀಗೆ ಕೇಳಿ',

    app_name: 'ಮತ್ಸ್ಯಮಿತ್ರ',
    app_subtitle: 'ನಿಮ್ಮ ಮೀನುಗಾರಿಕೆಯ ಸಂಗಾತಿ',
    greeting_morning: 'ಶುಭೋದಯ',
    greeting_afternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ',
    greeting_evening: 'ಶುಭ ಸಂಜೆ',
    user_full_name: 'ರಮೇಶ್ ಕುಮಾರ್!',
    banner_slogan_kn: 'ಸುರಕ್ಷಿತ ಸಮುದ್ರ,\nಹೆಚ್ಚು ಮೀನು, ಉತ್ತಮ ಜೀವನ',
    banner_slogan_en: 'ಸುರಕ್ಷಿತ ಸಮುದ್ರ • ಹೆಚ್ಚು ಮೀನು • ಬಲಿಷ್ಠ ಭವಿಷ್ಯ',
    current_conditions: 'ಪ್ರಸ್ತುತ ವಾತಾವರಣ',
    safe_to_fish: 'ಮೀನುಗಾರಿಕೆಗೆ ಸುರಕ್ಷಿತ',
    caution_to_fish: 'ಎಚ್ಚರಿಕೆ ವಹಿಸಿ',
    unsafe_to_fish: 'ಸಮುದ್ರಕ್ಕೆ ಇಳಿಯಬೇಡಿ',
    view_all: 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ',
    badge_pro: 'ಪ್ರೊ',
    live_connected: 'ಲೈವ್ ಸಂಪರ್ಕದಲ್ಲಿದೆ',
    offline_cached: 'ನೇರ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ',
    connecting: 'ಮತ್ಸ್ಯಮಿತ್ರ ಸರ್ವರ್‌ಗೆ ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ...',

    wind_speed: 'ಗಾಳಿಯ ವೇಗ',
    wave_height: 'ಅಲೆಯ ಎತ್ತರ',
    humidity: 'ತೇವಾಂಶ',
    sea_temp: 'ನೀರಿನ ಬಿಸಿ',
    chlorophyll: 'ಕ್ಲೋರೋಫಿಲ್',
    km_per_hour: 'ಕಿ.ಮೀ/ಗಂ',
    meters: 'ಮೀಟರ್',

    cond_clear_calm: 'ತಿಳಿ & ಶಾಂತ ವಾತಾವರಣ',
    cond_moderate: 'ಸಾಧಾರಣ ವಾತಾವರಣ',
    cond_rough_sea: 'ಸಮುದ್ರ ಪ್ರಕ್ಷುಬ್ಧ (ಅಪಾಯ)',
    cond_high_wind: 'ಜೋರು ಬಿರುಗಾಳಿ',
    cond_favorable: 'ಮೀನುಗಾರಿಕೆಗೆ ಸರಿ ಇದೆ',
    cond_caution: 'ಎಚ್ಚರಿಕೆಯಿಂದ ಹೋಗಿ',
    cond_dangerous: 'ಅಪಾಯ - ಸಮುದ್ರಕ್ಕೆ ಹೋಗಬೇಡಿ',

    advisory_title: 'ಇಂದಿನ ಮೀನುಗಾರಿಕೆ ಸಲಹೆ',
    advisory_official: 'ಇನ್ಕೋಯಿಸ್ (INCOIS) ಅಧಿಕೃತ ಮಾಹಿತಿ',
    advisory_view_map: 'ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಿ',
    advisory_none_active: 'ಯಾವುದೇ ಹೊಸ ಅಪಾಯದ ಎಚ್ಚರಿಕೆ ಇಲ್ಲ. ಸಮುದ್ರ ಶಾಂತವಾಗಿದೆ, ಕರಾವಳಿ ಮೀನುಗಾರಿಕೆಗೆ ಹೋಗಬಹುದು.',
    advisory_safe_notice: 'ಸಾಮಾನ್ಯ ಮೀನುಗಾರಿಕೆಗೆ ಪರಿಸ್ಥಿತಿ ಅನುಕೂಲಕರವಾಗಿದೆ.',
    advisory_loading: 'ಮಾಹಿತಿ ಪಡೆಯಲಾಗುತ್ತಿದೆ...',
    advisory_view_more: 'ಇನ್ನಷ್ಟು ಸಲಹೆಗಳು',
    advisory_show_less: 'ಕಡಿಮೆ ಮಾಡಿ',
    today_advisory: 'ಇಂದಿನ ಸಲಹೆ',
    view_on_map: 'ನಕ್ಷೆಯಲ್ಲಿ ವೀಕ್ಷಿಸಿ',
    greeting_namaskara: 'ನಮಸ್ಕಾರ',
    user_rameshanna: 'ರಮೇಶಣ್ಣ!',
    check_sea_conditions: 'ಇಂದು ಸಮುದ್ರಕ್ಕಿಳಿಯುವ ಮುನ್ನ ಕಡಲಿನ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ.',
    wind_label: 'ಗಾಳಿ',
    waves_label: 'ಅಲೆಗಳು',
    humidity_label: 'ತೇವಾಂಶ',
    sea_temp_label: 'ಕಡಲ ತಾಪಮಾನ',
    chlorophyll_label: 'ಕ್ಲೋರೋಫಿಲ್',
    favorable_for_fishing: 'ಮೀನುಗಾರಿಕೆಗೆ ಯೋಗ್ಯ ವಲಯ',
    pfz_near_honnavar: 'ಹೊನ್ನಾವರ ಸಮೀಪ ಸಂಭಾವ್ಯ ಮೀನುಗಾರಿಕೆ ವಲಯ',

    qa_fleet: 'ಬಂದರು ಸ್ಥಿತಿ',
    qa_catch: 'ಮೀನಿನ ಲೆಕ್ಕ',
    qa_distress: 'ತುರ್ತು ಸಹಾಯ (SOS)',
    qa_equipment: 'ಸಾಮಗ್ರಿ ತಪಾಸಣೆ',

    cl_title: 'ಮೀನಿನ ಲೆಕ್ಕ',
    cl_subtitle: '100% ಆಫ್‌ಲೈನ್ ದಾಖಲೆ',
    cl_new_entry: 'ಹೊಸ ಲೆಕ್ಕ',
    cl_history: 'ಹಿಂದಿನ ಲೆಕ್ಕ',
    cl_select_species: 'ಮೀನಿನ ಜಾತಿ ಆಯ್ಕೆಮಾಡಿ',
    cl_custom_species: 'ಬೇರೆ ಮೀನಿನ ಹೆಸರು ಟೈಪ್ ಮಾಡಿ...',
    cl_weight_kg: 'ತೂಕ (ಕೆ.ಜಿ) *',
    cl_rate_per_kg: 'ದರ (₹ / ಕೆ.ಜಿ)',
    cl_notes: 'ದೋಣಿ / ಬಲೆ / ಜಾಗದ ಟಿಪ್ಪಣಿ',
    cl_btn_save: 'ಲೆಕ್ಕ ಸೇರಿಸಿ',
    cl_total_weight: 'ಒಟ್ಟು ಮೀನು',
    cl_total_revenue: 'ಅಂದಾಜು ಗಳಿಕೆ',
    cl_no_records: 'ಇನ್ನೂ ಯಾವುದೇ ಮೀನಿನ ಲೆಕ್ಕ ದಾಖಲಾಗಿಲ್ಲ. ಮೇಲೆ ಹೊಸ ಲೆಕ್ಕ ಸೇರಿಸಿ.',
    cl_delete_confirm: 'ಈ ದಾಖಲೆಯನ್ನು ಅಳಿಸಲು ಖಚಿತವೇ?',

    species_mackerel: 'ಬಂಗುಡೆ (Mackerel)',
    species_sardine: 'ತಾರಲೆ / ಬೂತಾಯಿ (Sardine)',
    species_kingfish: 'ಅಂಜಲ್ / ಸುರಮಾಯಿ (Kingfish)',
    species_pomfret: 'ಮಾಂಜಿ / ಬೆಳ್ಳಿ ಮಾಂಜಿ (Pomfret)',
    species_tuna: 'ಗೆದ್ದರ್ / ತೂನ (Tuna)',
    species_prawn: 'ಸೀಗಡಿ (Prawn)',
    species_squid: 'ಬೊಂಡಾಸ್ / ಸಿಂಪ್ಟೆ (Squid)',

    sos_title: 'ತುರ್ತು ಅಪಾಯದ ಕರೆ (SOS)',
    sos_subtitle: 'ಸಮುದ್ರ ಭದ್ರತೆ & ತುರ್ತು ಸಂದೇಶ',
    sos_position_beacon: 'ನಿಮ್ಮ ಸದ್ಯದ ಜಾಗ (GPS)',
    sos_latitude: 'ಅಕ್ಷಾಂಶ (LAT)',
    sos_longitude: 'ರೇಖಾಂಶ (LON)',
    sos_broadcast_btn: 'ತುರ್ತು ಸಂದೇಶ ಕಳುಹಿಸಿ (SMS)',
    sos_broadcast_sub: 'ಕರಾವಳಿ ಪೊಲೀಸರಿಗೆ (1093) ನಿಮ್ಮ ಜಾಗದ ನಕ್ಷೆ ಮತ್ತು ತುರ್ತು ಸಂದೇಶ ತಕ್ಷಣ ಕಳುಹಿಸುತ್ತದೆ',
    sos_helpline_heading: 'ನೇರ ಸಹಾಯವಾಣಿ ಕರೆಗಳು',
    sos_coast_guard: 'ಕರಾವಳಿ ಕಾವಲು ಪಡೆ (ಕೋಸ್ಟ್ ಗಾರ್ಡ್)',
    sos_coast_guard_sub: 'ಸಮುದ್ರ ಶೋಧನೆ ಮತ್ತು ರಕ್ಷಣಾ ಪಡೆ (ಉಚಿತ ಕರೆ)',
    sos_coastal_police: 'ಕರ್ನಾಟಕ ಕರಾವಳಿ ಭದ್ರತಾ ಪೊಲೀಸ್',
    sos_coastal_police_sub: 'ಕರಾವಳಿ ಪೊಲೀಸ್ ಹೆಲ್ಪ್‌ಲೈನ್ (CSP)',
    sos_emergency_112: 'ರಾಷ್ಟ್ರೀಯ ತುರ್ತು ಸೇವೆ (112)',
    sos_emergency_112_sub: 'ಪೊಲೀಸ್, ಆಂಬ್ಯುಲೆನ್ಸ್ ಮತ್ತು ಅಗ್ನಿಶಾಮಕ',
    sos_call_btn: 'ಕರೆ ಮಾಡಿ',
    sos_2g_notice: 'ಸಮುದ್ರದಲ್ಲಿ ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದಿದ್ದರೂ ಸಾಮಾನ್ಯ 2G ಮೊಬೈಲ್ ಟವರ್ ಸಿಗ್ನಲ್ ಮೂಲಕ SMS ತುರ್ತು ಸಂದೇಶ ರವಾನೆಯಾಗುತ್ತದೆ. ಉತ್ತಮ ಸಿಗ್ನಲ್‌ಗಾಗಿ ಫೋನ್‌ ಅನ್ನು ಎತ್ತರದಲ್ಲಿ ಹಿಡಿಯಿರಿ.',

    eq_title: 'ದೋಣಿ ಸಾಮಗ್ರಿ ತಪಾಸಣೆ',
    eq_subtitle: 'ಬಂದರು ಬಿಡುವ ಮುನ್ನ ತಪಾಸಣೆ',
    eq_readiness_title: 'ಪ್ರಯಾಣದ ಸಿದ್ಧತೆ',
    eq_ready_to_sail: 'ಹೊರಡಲು ಸಿದ್ಧವಾಗಿದೆ',
    eq_attention_required: 'ಗಮನಿಸಿ - ಸಾಮಗ್ರಿ ಕೊರತೆ ಇದೆ',
    eq_safety_count: 'ಸಾಮಗ್ರಿ ಸಿದ್ಧವಾಗಿದೆ',
    eq_reset_btn: 'ಮೊದಲಿನಿಂದ',
    eq_item_life_jackets: 'ಲೈಫ್ ಜಾಕೆಟ್‌ಗಳು (Life Jackets)',
    eq_item_life_jackets_desc: 'ದೋಣಿಯಲ್ಲಿರುವ ಪ್ರತಿಯೊಬ್ಬ ನಾವಿಕನಿಗೂ 1 ಜಾಕೆಟ್',
    eq_item_vhf: 'ವೈರ್‌ಲೆಸ್ ಮರೈನ್ ರೇಡಿಯೋ (VHF)',
    eq_item_vhf_desc: 'ಚಾನೆಲ್ 16 ರಲ್ಲಿ ಪರೀಕ್ಷಿಸಿ ಸರಿಯಾಗಿದೆ',
    eq_item_gps: 'ಜಿ.ಪಿ.ಎಸ್ / ಕಂಪಾಸ್ ಉಪಕರಣ',
    eq_item_gps_desc: 'ಬ್ಯಾಟರಿ ಫುಲ್ ಚಾರ್ಜ್ ಮತ್ತು ಬಂದರು ಗುರುತುಗಳೊಂದಿಗೆ',
    eq_item_flares: 'ಅಪಾಯದ ಸಿಗ್ನಲ್ ಫ್ಲೇರ್ಸ್ / ಹೊಗೆ',
    eq_item_flares_desc: 'ಕೆಂಪು ಫ್ಲೇರ್ ಮತ್ತು ಕಿತ್ತಳೆ ಹೊಗೆ ಸಂಕೇತ ಸರಿಯಾಗಿದೆ',
    eq_item_fuel_water: 'ಹೆಚ್ಚುವರಿ ಡೀಸೆಲ್ & ಕುಡಿಯುವ ನೀರು',
    eq_item_fuel_water_desc: 'ಕನಿಷ್ಠ 25% ಹೆಚ್ಚುವರಿ ಡೀಸೆಲ್ + ಪ್ರತಿ ವ್ಯಕ್ತಿಗೆ 5L ನೀರು',
    eq_item_first_aid: 'ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ ಕಿಟ್ (First Aid)',
    eq_item_first_aid_desc: 'ಬ್ಯಾಂಡೇಜ್, ಮದ್ದು, ಸುಟ್ಟ ಗಾಯದ ಮುಲಾಮು, ವಾಂತಿ ಮಾತ್ರೆ',
    eq_item_anchor: 'ಹೆಚ್ಚುವರಿ ಲಂಗರು & ಪಂಪ್',
    eq_item_anchor_desc: 'ತುರ್ತು ಸಮಯದಲ್ಲಿ ನೀರು ಹೊರಹಾಕುವ ಪಂಪ್ ಮತ್ತು ಲಂಗರು',

    ft_title: 'ಬಂದರುಗಳ ಸಮುದ್ರ ಸ್ಥಿತಿ',
    ft_subtitle: 'ನೇರ ಗಾಳಿ ಮತ್ತು ಅಲೆ ಮಾಹಿತಿ',
    ft_boats_reporting: 'ವರದಿ ಮಾಡಿದ ದೋಣಿಗಳು',
    ft_in_fishing_zones: 'ಮೀನುಗಾರಿಕೆ ವಲಯದಲ್ಲಿರುವ ದೋಣಿಗಳು',
    ft_ports_covered: '6 ಪ್ರಮುಖ ಬಂದರುಗಳಲ್ಲಿ',
    ft_zone_distance: '12–25 ನಾಟಿಕಲ್ ಮೈಲಿ ದೂರದಲ್ಲಿ',
    ft_crowd_notice: 'ಮೀನುಗಾರರ ಬಲೆ ಸಿಕ್ಕಿಹಾಕಿಕೊಳ್ಳುವುದನ್ನು ತಪ್ಪಿಸಲು ಮತ್ತು ಅತಿಯಾದ ಮೀನುಗಾರಿಕೆ ತಡೆಯಲು ಮತ್ಸ್ಯಮಿತ್ರ ದೋಣಿಗಳನ್ನು ಸಮವಾಗಿ ಹಂಚಿಕೆ ಮಾಡುತ್ತದೆ.',
    ft_harbor_status_title: 'ಬಂದರುಗಳಲ್ಲಿ ದೋಣಿಗಳ ಸ್ಥಿತಿ',
    ft_vessels_registered: 'ನೋಂದಾಯಿತ ದೋಣಿಗಳು',
    ft_vessels_offshore: 'ಸಮುದ್ರದಲ್ಲಿವೆ',
    density_low: 'ಕಡಿಮೆ ದಟ್ಟಣೆ',
    density_moderate: 'ಸಾಧಾರಣ ದಟ್ಟಣೆ',
    density_high: 'ಹೆಚ್ಚು ದಟ್ಟಣೆ',

    loc_select_title: 'ಕರಾವಳಿ ಬಂದರು ಆಯ್ಕೆಮಾಡಿ',
    loc_search_placeholder: 'ಬಂದರು ಹುಡುಕಿ...',
    loc_active_badge: 'ಸಕ್ರಿಯ',

    alerts_screen_title: 'ಎಚ್ಚರಿಕೆಗಳು & ಪ್ರಕಟಣೆಗಳು',
    alerts_live_connected: 'ಲೈವ್ ಸಂಪರ್ಕದಲ್ಲಿದೆ',
    alerts_offline_cached: 'ಆಫ್‌ಲೈನ್ / ಹಳೆಯ ಪ್ರಕಟಣೆಗಳು',
    alerts_filter_all: 'ಎಲ್ಲವೂ',
    alerts_filter_official: 'ಅಧಿಕೃತ',
    alerts_filter_weather: 'ಹವಾಮಾನ',
    alerts_filter_advisory: 'ಮೀನುಗಾರಿಕೆ ಮಾಹಿತಿ',
    alerts_filter_news: 'ಸುದ್ದಿ',
    alerts_empty_title: 'ಇಂದು ಯಾವುದೇ ಹೊಸ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ',
    alerts_empty_subtitle: 'ಸಮುದ್ರ ಶಾಂತವಾಗಿದೆ. ಅಧಿಕೃತ ಮಾಹಿತಿ ಅಥವಾ ಹೊಸ ಎಚ್ಚರಿಕೆ ಬಂದರೆ ತಕ್ಷಣ ಇಲ್ಲಿ ತಿಳಿಸಲಾಗುವುದು.',
    alerts_empty_refresh_btn: 'ಹೊಸ ಮಾಹಿತಿ ಪರಿಶೀಲಿಸಿ',

    profile_title: 'ಪ್ರೊಫೈಲ್ & ದೋಣಿ ಮಾಹಿತಿ',
    profile_fisher_verified: 'ದೃಢೀಕೃತ ಮೀನುಗಾರ ಐಡಿ',
    profile_stat_trips: 'ದಾಖಲಾದ ಪ್ರಯಾಣ',
    profile_stat_exp: 'ವರ್ಷಗಳ ಅನುಭವ',
    profile_stat_rating: 'ಶ್ರೇಯಾಂಕ',
    profile_vessel_info: 'ದೋಣಿಯ ವಿವರಗಳು',
    profile_vessel_name: 'ದೋಣಿಯ ಹೆಸರು',
    profile_reg_number: 'ನೋಂದಣಿ ಸಂಖ್ಯೆ',
    profile_vessel_type: 'ದೋಣಿಯ ಪ್ರಕಾರ',
    profile_location_settings: 'ಸ್ಥಳ ಮತ್ತು ಬಂದರು',
    profile_default_port: 'ಮುಖ್ಯ ತವರು ಬಂದರು',
    profile_coverage_area: 'ವ್ಯಾಪ್ತಿ ಪ್ರದೇಶ',
    profile_karnataka_coast: 'ಕರ್ನಾಟಕ ಕರಾವಳಿ ತೀರ',
    profile_language_title: 'ಭಾಷೆ (Language)',
    profile_notifications_title: 'ಅಲರ್ಟ್ ಸೂಚನೆಗಳು',
    profile_push_notifications: 'ಮೊಬೈಲ್ ನೋಟಿಫಿಕೇಶನ್‌ಗಳು',
    profile_weather_alerts: 'ಕಡಲ ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳು',
    profile_edit_vessel: 'ದೋಣಿ ವಿವರ ಬದಲಾಯಿಸಿ',
    profile_btn_save: 'ಉಳಿಸಿ',
    profile_save_success: 'ದೋಣಿ ಮತ್ತು ಬಂದರಿನ ವಿವರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!',
    profile_select_port: 'ಮುಖ್ಯ ತವರು ಬಂದರು ಆಯ್ಕೆಮಾಡಿ',
    vessel_traditional_canoe: 'ಸಾಂಪ್ರದಾಯಿಕ ದೋಣಿ (Canoe)',
    vessel_motorized_craft: 'ಮೋಟಾರ್ ದೋಣಿ (OBM Craft)',
    vessel_mechanized_trawler: 'ಮೆಕನೈಸ್ಡ್ ಟ್ರಾಲರ್ (Trawler)',
    vessel_purse_seiner: 'ಪರ್ಸಿನ್ ದೋಣಿ (Purse Seiner)',
    vessel_gillnetter: 'ಗಿಲ್‌ನೆಟ್ ದೋಣಿ (Gillnetter)',

    btn_close: 'ಮುಚ್ಚಿ',
    btn_cancel: 'ರದ್ದು',
    btn_confirm: 'ಖಚಿತಪಡಿಸಿ',
    btn_refresh: 'ತಾಜಾ ಮಾಡಿ',
  },
};

export type TranslationKey = keyof Translations;
